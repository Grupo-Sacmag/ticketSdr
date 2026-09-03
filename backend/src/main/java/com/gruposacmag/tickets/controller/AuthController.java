package com.gruposacmag.tickets.controller;

import com.gruposacmag.tickets.dto.AuthResponse;
import com.gruposacmag.tickets.dto.LoginRequest;
import com.gruposacmag.tickets.dto.RegisterRequest;
import com.gruposacmag.tickets.model.Usuario;
import com.gruposacmag.tickets.repository.UsuarioRepository;
import com.gruposacmag.tickets.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import com.gruposacmag.tickets.service.VerificacionService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final VerificacionService verificacionService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        // Verificar si el correo ya existe
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            Usuario existente = usuarioRepository.findByCorreo(request.getCorreo()).get();

            // Si ya está verificado → error normal
            if (existente.getVerificado()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("El correo ya está registrado");
            }

            // Si no está verificado pero tiene código activo → pedir que lo use
            if (existente.getCodigoExpiracion() != null &&
                    existente.getCodigoExpiracion().isAfter(java.time.LocalDateTime.now())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(java.util.Map.of(
                                "tipo", "CODIGO_ACTIVO",
                                "correo", existente.getCorreo(),
                                "expiracion", existente.getCodigoExpiracion().toString(),
                                "mensaje", "Ya tienes un código activo. Ingresa el código enviado a tu correo."
                        ));
            }

            // Si tiene código pero ya expiró → generar uno nuevo
            verificacionService.enviarCodigo(existente);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(java.util.Map.of(
                            "tipo", "NUEVO_CODIGO",
                            "correo", existente.getCorreo(),
                            "mensaje", "Tu código anterior expiró. Enviamos uno nuevo a tu correo."
                    ));
        }

        // Usuario nuevo
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setCorreo(request.getCorreo());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuarioRepository.save(usuario);

        verificacionService.enviarCodigo(usuario);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(java.util.Map.of(
                        "tipo", "NUEVO_CODIGO",
                        "correo", usuario.getCorreo(),
                        "expiracion", usuario.getCodigoExpiracion() != null ?
                                usuario.getCodigoExpiracion().toString() : "",
                        "mensaje", "Código de verificación enviado a " + usuario.getCorreo()
                ));
    }

    // Verificar el código OTP
    @PostMapping("/verificar")
    public ResponseEntity<?> verificar(@RequestBody Map<String, String> body) {
        try {
            String correo = body.get("correo");
            String codigo = body.get("codigo");

            Usuario usuario = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (usuario.getVerificado()) {
                return ResponseEntity.ok("La cuenta ya está verificada");
            }

            if (!verificacionService.verificarCodigo(usuario, codigo)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Código incorrecto o expirado");
            }

            verificacionService.activarCuenta(usuario);

            // Generar token para acceso inmediato tras verificación
            String token = jwtService.generarToken(usuario.getCorreo());

            return ResponseEntity.ok(new AuthResponse(
                    token,
                    usuario.getNombre(),
                    usuario.getCorreo(),
                    usuario.getRol(),
                    usuario.getPasswordTemporal()  // ← agrega esto
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // Reenviar código si expiró
    @PostMapping("/reenviar-codigo")
    public ResponseEntity<?> reenviarCodigo(@RequestBody Map<String, String> body) {
        try {
            String correo = body.get("correo");

            Usuario usuario = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (usuario.getVerificado()) {
                return ResponseEntity.badRequest()
                        .body("Esta cuenta ya está verificada");
            }

            verificacionService.enviarCodigo(usuario);

            return ResponseEntity.ok("Código reenviado a " + correo);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return usuarioRepository.findByCorreo(request.getCorreo())
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPassword()))
                .map(u -> {
                    // Bloquear acceso si no está verificado
                    if (!u.getVerificado()) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body((Object) Map.of(
                                        "error", "CUENTA_NO_VERIFICADA",
                                        "correo", u.getCorreo(),
                                        "mensaje", "Cuenta no verificada. Revisa tu correo."
                                ));
                    }

                    String token = jwtService.generarToken(u.getCorreo());
                    return ResponseEntity.ok((Object) new AuthResponse(
                            token,
                            u.getNombre(),
                            u.getCorreo(),
                            u.getRol(),
                            u.getPasswordTemporal()  // ← agrega esto
                    ));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    // Listar todos los usuarios (solo ADMIN)
    @GetMapping("/usuarios")
    public ResponseEntity<?> listarUsuarios(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario admin = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permisos para esta acción");
            }

            List<Map<String, Object>> respuesta = usuarioRepository.findAllByOrderByFechaCreacionDesc()
                    .stream().map(u -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", u.getId());
                        map.put("nombre", u.getNombre());
                        map.put("correo", u.getCorreo());
                        map.put("rol", u.getRol());
                        map.put("activo", u.getActivo());
                        map.put("fechaCreacion", u.getFechaCreacion() != null ? u.getFechaCreacion().toString() : "");
                        return map;
                    }).collect(Collectors.toList());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // Cambiar rol de un usuario (solo ADMIN)
    @PutMapping("/usuarios/{id}/rol")
    public ResponseEntity<?> cambiarRol(@RequestHeader("Authorization") String authHeader, @PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario admin = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permisos para esta acción");
            }

            Usuario usuario = usuarioRepository.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            usuario.setRol(body.get("rol"));
            usuarioRepository.save(usuario);

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Rol actualizado correctamente");
            respuesta.put("nombre", usuario.getNombre());
            respuesta.put("rol", usuario.getRol());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // Activar/desactivar usuario (solo ADMIN)
    @PutMapping("/usuarios/{id}/estado")
    public ResponseEntity<?> cambiarEstadoUsuario(@RequestHeader("Authorization") String authHeader, @PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario admin = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permisos para esta acción");
            }

            Usuario usuario = usuarioRepository.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            usuario.setActivo(body.get("activo"));
            usuarioRepository.save(usuario);

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Estado actualizado correctamente");
            respuesta.put("nombre", usuario.getNombre());
            respuesta.put("activo", usuario.getActivo());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // ── Reset de contraseña (solo ADMIN) ───────────────────────────────────────── El admin pone una contraseña temporal y el sistema obliga al usuario a cambiarla7
    @PutMapping("/usuarios/{id}/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede resetear contraseñas");
            }

            Usuario usuario = usuarioRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String passwordTemporal = body.get("password");
            if (passwordTemporal == null || passwordTemporal.length() < 6) {
                return ResponseEntity.badRequest()
                        .body("La contraseña temporal debe tener mínimo 6 caracteres");
            }

            // Guardamos la contraseña encriptada y marcamos el banderín
            usuario.setPassword(passwordEncoder.encode(passwordTemporal));
            usuario.setPasswordTemporal(true);   // ← obliga al usuario a cambiarla al entrar
            usuarioRepository.save(usuario);

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Contraseña temporal asignada correctamente",
                    "nombre", usuario.getNombre()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // ── Cambiar contraseña propia (usuario autenticado) ─────────────────────────── Se usa cuando el usuario entra con contraseña temporal y necesita cambiarla
    @PutMapping("/cambiar-password")
    public ResponseEntity<?> cambiarPassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario usuario = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String passwordActual = body.get("passwordActual");
            String passwordNueva  = body.get("passwordNueva");

            // Verificamos que la contraseña actual sea correcta antes de cambiarla
            if (!passwordEncoder.matches(passwordActual, usuario.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("La contraseña actual no es correcta");
            }

            if (passwordNueva == null || passwordNueva.length() < 6) {
                return ResponseEntity.badRequest()
                        .body("La nueva contraseña debe tener mínimo 6 caracteres");
            }

            usuario.setPassword(passwordEncoder.encode(passwordNueva));
            usuario.setPasswordTemporal(false);   // ← apagamos el banderín
            usuarioRepository.save(usuario);

            return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada correctamente"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/tiempo-codigo")
        public ResponseEntity<?> tiempoCodigo(@RequestParam String correo) {
            try {
                Usuario usuario = usuarioRepository.findByCorreo(correo)
                        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                if (usuario.getVerificado()) {
                    return ResponseEntity.ok(Map.of(
                            "verificado", true,
                            "tieneCodigoActivo", false,
                            "segundosRestantes", 0
                    ));
                }

                if (usuario.getCodigoExpiracion() == null) {
                    return ResponseEntity.ok(Map.of(
                            "verificado", false,
                            "tieneCodigoActivo", false,
                            "segundosRestantes", 0
                    ));
                }

                long segundos = java.time.Duration.between(
                        java.time.LocalDateTime.now(),
                        usuario.getCodigoExpiracion()
                ).getSeconds();

                segundos = Math.max(0, segundos);

                return ResponseEntity.ok(Map.of(
                        "verificado", false,
                        "tieneCodigoActivo", segundos > 0,
                        "segundosRestantes", segundos
                ));

            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error: " + e.getMessage());
            }
        }
}
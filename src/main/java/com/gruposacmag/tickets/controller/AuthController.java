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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        // Verificar si el correo ya existe
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("El correo ya está registrado");
        }

        // Crear el usuario
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setCorreo(request.getCorreo());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));

        usuarioRepository.save(usuario);

        // Generar token inmediatamente después del registro
        String token = jwtService.generarToken(usuario.getCorreo());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(
                        token,
                        usuario.getNombre(),
                        usuario.getCorreo(),
                        usuario.getRol()
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        // Buscar el usuario por correo
        return usuarioRepository.findByCorreo(request.getCorreo())
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPassword()))
                .map(u -> {
                    String token = jwtService.generarToken(u.getCorreo());
                    return ResponseEntity.ok(new AuthResponse(
                            token,
                            u.getNombre(),
                            u.getCorreo(),
                            u.getRol()
                    ));
                })
                .orElse(ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .build());
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
}
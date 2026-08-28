package com.gruposacmag.tickets.controller;

import com.gruposacmag.tickets.model.AplicacionSACMAG;
import com.gruposacmag.tickets.model.Departamento;
import com.gruposacmag.tickets.model.Usuario;
import com.gruposacmag.tickets.repository.AplicacionRepository;
import com.gruposacmag.tickets.repository.DepartamentoRepository;
import com.gruposacmag.tickets.repository.UsuarioRepository;
import com.gruposacmag.tickets.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/catalogos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CatalogoController {

    private final DepartamentoRepository departamentoRepository;
    private final AplicacionRepository   aplicacionRepository;
    private final UsuarioRepository      usuarioRepository;
    private final JwtService             jwtService;

    // ── GET /api/catalogos/departamentos ─────────────────────────────────────
    // Devuelve todos los departamentos activos.
    // Lo usan los selectores del frontend (crear usuario, filtrar tickets).
    @GetMapping("/departamentos")
    public ResponseEntity<?> listarDepartamentos(
            @RequestHeader("Authorization") String authHeader) {
        try {
            jwtService.extraerCorreo(authHeader.substring(7)); // valida token

            List<Map<String, Object>> respuesta = departamentoRepository
                    .findByActivoTrueOrderByNombreAsc()
                    .stream().map(d -> Map.<String, Object>of(
                            "id",          d.getId(),
                            "nombre",      d.getNombre(),
                            "descripcion", d.getDescripcion() != null ? d.getDescripcion() : ""
                    )).collect(Collectors.toList());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // ── GET /api/catalogos/aplicaciones ──────────────────────────────────────
    // Devuelve todas las aplicaciones activas con su departamento.
    // ReportarTicket.jsx carga esta lista en lugar de tenerla hardcodeada.
    @GetMapping("/aplicaciones")
    public ResponseEntity<?> listarAplicaciones(
            @RequestHeader("Authorization") String authHeader) {
        try {
            jwtService.extraerCorreo(authHeader.substring(7));

            List<Map<String, Object>> respuesta = aplicacionRepository
                    .findByActivaTrueOrderByNombreAsc()
                    .stream().map(a -> {
                        var map = new java.util.HashMap<String, Object>();
                        map.put("id",     a.getId());
                        map.put("nombre", a.getNombre());
                        if (a.getDepartamento() != null) {
                            map.put("departamentoId",     a.getDepartamento().getId());
                            map.put("departamentoNombre", a.getDepartamento().getNombre());
                        } else {
                            map.put("departamentoId",     null);
                            map.put("departamentoNombre", "Sin departamento");
                        }
                        return map;
                    }).collect(Collectors.toList());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // ── PUT /api/catalogos/aplicaciones/{id}/departamento ────────────────────
    // Asigna un departamento a una aplicación (solo ADMIN).
    // Desde el panel de catálogos del admin se puede reasignar.
    @PutMapping("/aplicaciones/{id}/departamento")
    public ResponseEntity<?> asignarDepartamentoAplicacion(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede modificar catálogos");
            }

            AplicacionSACMAG app = aplicacionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Aplicación no encontrada"));

            Departamento dept = departamentoRepository.findById(body.get("departamentoId"))
                    .orElseThrow(() -> new RuntimeException("Departamento no encontrado"));

            app.setDepartamento(dept);
            aplicacionRepository.save(app);

            return ResponseEntity.ok(Map.of(
                    "mensaje",             "Departamento asignado correctamente",
                    "aplicacion",          app.getNombre(),
                    "departamento",        dept.getNombre()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // ── PUT /api/catalogos/usuarios/{id}/departamento ─────────────────────────
    // Asigna un departamento a un usuario (solo ADMIN).
    @PutMapping("/usuarios/{id}/departamento")
    public ResponseEntity<?> asignarDepartamentoUsuario(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede asignar departamentos");
            }

            Usuario usuario = usuarioRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (body.get("departamentoId") != null) {
                Departamento dept = departamentoRepository
                        .findById(body.get("departamentoId"))
                        .orElseThrow(() -> new RuntimeException("Departamento no encontrado"));
                usuario.setDepartamento(dept);
            } else {
                // Si mandan null, quitamos la asignación
                usuario.setDepartamento(null);
            }

            usuarioRepository.save(usuario);

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Departamento actualizado correctamente",
                    "nombre",  usuario.getNombre()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // Crear nueva aplicación
    @PostMapping("/aplicaciones")
    public ResponseEntity<?> crearAplicacion(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede crear aplicaciones");
            }

            AplicacionSACMAG app = new AplicacionSACMAG();
            app.setNombre(body.get("nombre"));
            app.setDescripcion(body.get("descripcion"));
            aplicacionRepository.save(app);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("mensaje", "Aplicación creada correctamente",
                            "nombre", app.getNombre()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // Activar/desactivar aplicación
    @PutMapping("/aplicaciones/{id}/estado")
    public ResponseEntity<?> cambiarEstadoAplicacion(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede modificar aplicaciones");
            }

            AplicacionSACMAG app = aplicacionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Aplicación no encontrada"));

            app.setActiva(body.get("activa"));
            aplicacionRepository.save(app);

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Estado actualizado correctamente",
                    "nombre", app.getNombre(),
                    "activa", app.getActiva()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // Crear nuevo departamento
    @PostMapping("/departamentos")
    public ResponseEntity<?> crearDepartamento(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede crear departamentos");
            }

            Departamento dept = new Departamento();
            dept.setNombre(body.get("nombre"));
            dept.setDescripcion(body.get("descripcion"));
            departamentoRepository.save(dept);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("mensaje", "Departamento creado correctamente",
                            "nombre", dept.getNombre()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // Activar/desactivar departamento
    @PutMapping("/departamentos/{id}/estado")
    public ResponseEntity<?> cambiarEstadoDepartamento(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede modificar departamentos");
            }

            Departamento dept = departamentoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Departamento no encontrado"));

            dept.setActivo(body.get("activo"));
            departamentoRepository.save(dept);

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Estado actualizado correctamente",
                    "nombre", dept.getNombre()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // Listar TODAS las aplicaciones (activas e inactivas) para el panel admin
    @GetMapping("/aplicaciones/todas")
    public ResponseEntity<?> todasLasAplicaciones(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Sin permisos");
            }

            List<Map<String, Object>> respuesta = aplicacionRepository
                    .findAll()
                    .stream()
                    .map(a -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", a.getId());
                        map.put("nombre", a.getNombre());
                        map.put("descripcion",
                                a.getDescripcion() != null ? a.getDescripcion() : "");
                        map.put("activa", a.getActiva());
                        map.put("departamentoId",
                                a.getDepartamento() != null ? a.getDepartamento().getId() : null);
                        map.put("departamentoNombre",
                                a.getDepartamento() != null
                                        ? a.getDepartamento().getNombre()
                                        : "Sin departamento");
                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // Listar TODOS los departamentos para el panel admin
    @GetMapping("/departamentos/todos")
    public ResponseEntity<?> todosLosDepartamentos(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Sin permisos");
            }

            List<Map<String, Object>> respuesta = departamentoRepository
                    .findAll()
                    .stream()
                    .map(d -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", d.getId());
                        map.put("nombre", d.getNombre());
                        map.put("descripcion",
                                d.getDescripcion() != null ? d.getDescripcion() : "");
                        map.put("activo", d.getActivo());
                        return map;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // ── Editar departamento (nombre y descripción) ────────────────────────────
    @PutMapping("/departamentos/{id}")
    public ResponseEntity<?> editarDepartamento(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede editar departamentos");
            }

            Departamento dept = departamentoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Departamento no encontrado"));

            if (body.get("nombre") != null && !body.get("nombre").isBlank())
                dept.setNombre(body.get("nombre"));
            if (body.get("descripcion") != null)
                dept.setDescripcion(body.get("descripcion"));

            departamentoRepository.save(dept);

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Departamento actualizado correctamente",
                    "nombre",  dept.getNombre()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // ── Eliminar departamento ─────────────────────────────────────────────────
// Solo permite eliminar si no tiene usuarios ni tickets asociados,
// para no romper la integridad referencial de la BD.
    @DeleteMapping("/departamentos/{id}")
    public ResponseEntity<?> eliminarDepartamento(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede eliminar departamentos");
            }

            Departamento dept = departamentoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Departamento no encontrado"));

            // Verificar que no haya usuarios asignados a este departamento
            boolean tieneUsuarios = usuarioRepository.findAll().stream()
                    .anyMatch(u -> u.getDepartamento() != null &&
                            u.getDepartamento().getId().equals(id));

            if (tieneUsuarios) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("No se puede eliminar: hay usuarios asignados a este departamento");
            }

            departamentoRepository.delete(dept);

            return ResponseEntity.ok(Map.of(
                    "mensaje", "Departamento eliminado correctamente"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // ── Editar aplicación (nombre y descripción) ──────────────────────────────
    @PutMapping("/aplicaciones/{id}")
    public ResponseEntity<?> editarAplicacion(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String correo = jwtService.extraerCorreo(authHeader.substring(7));
            Usuario admin = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!admin.getRol().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Solo el administrador puede editar aplicaciones");
            }

            AplicacionSACMAG app = aplicacionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Aplicación no encontrada"));

            if (body.get("nombre") != null && !body.get("nombre").isBlank())
                app.setNombre(body.get("nombre"));
            if (body.get("descripcion") != null)
                app.setDescripcion(body.get("descripcion"));

            aplicacionRepository.save(app);

            return ResponseEntity.ok(Map.of(
                    "mensaje",    "Aplicación actualizada correctamente",
                    "nombre",     app.getNombre()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}
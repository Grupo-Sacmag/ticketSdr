package com.gruposacmag.tickets.controller;

import com.gruposacmag.tickets.model.Ticket;
import com.gruposacmag.tickets.model.Usuario;
import com.gruposacmag.tickets.repository.UsuarioRepository;
import com.gruposacmag.tickets.security.JwtService;
import com.gruposacmag.tickets.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import com.gruposacmag.tickets.model.Comentario;
import com.gruposacmag.tickets.repository.ComentarioRepository;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketService ticketService;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final ComentarioRepository comentarioRepository;

    @PostMapping
    public ResponseEntity<?> crearTicket(@RequestHeader("Authorization") String authHeader, @RequestParam("aplicacion") String aplicacion, @RequestParam("problema") String problema,
                                         @RequestParam("prioridad") String prioridad, @RequestParam(value = "imagen", required = false) MultipartFile imagen) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            Ticket ticket = ticketService.crearTicket(aplicacion, problema, prioridad, imagen, usuario);

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("folio", ticket.getFolio());
            respuesta.put("estado", ticket.getEstado());
            respuesta.put("fechaCreacion", ticket.getFechaCreacion().toString());

            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al crear el ticket: " + e.getMessage());
        }
    }

    @GetMapping("/mis-tickets")
    public ResponseEntity<?> misTickets(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            List<Ticket> tickets = ticketService.obtenerTicketsPorUsuario(usuario);

            List<Map<String, Object>> respuesta = tickets.stream().map(t -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", t.getId());  // ← agrega esta línea
                map.put("folio", t.getFolio());
                map.put("aplicacion", t.getAplicacion());
                map.put("prioridad", t.getPrioridad());
                map.put("estado", t.getEstado());
                map.put("problema", t.getProblema());
                map.put("fechaCreacion", t.getFechaCreacion().toString());
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al obtener tickets: " + e.getMessage());
        }
    }

    @GetMapping("/todos")
    public ResponseEntity<?> todosLosTickets(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!usuario.getRol().equals("ADMIN") && !usuario.getRol().equals("SOPORTE")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permisos para esta acción");
            }

            List<Ticket> tickets = ticketService.obtenerTodos();

            List<Map<String, Object>> respuesta = tickets.stream().map(t -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", t.getId());
                map.put("folio", t.getFolio());
                map.put("aplicacion", t.getAplicacion());
                map.put("prioridad", t.getPrioridad());
                map.put("estado", t.getEstado());
                map.put("problema", t.getProblema());
                map.put("creadoPor", t.getCreadoPor().getNombre());
                map.put("correoUsuario", t.getCreadoPor().getCorreo());
                map.put("fechaCreacion", t.getFechaCreacion().toString());
                map.put("rutaImagen", t.getRutaImagen());map.put("departamento", t.getDepartamento() != null ? t.getDepartamento().getNombre() : "Sin departamento");
                map.put("asignadoA", t.getAsignadoA() != null  ? t.getAsignadoA().getNombre() : null);
                map.put("asignadoId", t.getAsignadoA() != null  ? t.getAsignadoA().getId() : null);
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // Lista usuarios SOPORTE y ADMIN para asignar tickets
    @GetMapping("/asignables")
    public ResponseEntity<?> usuariosAsignables(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario solicitante = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!solicitante.getRol().equals("ADMIN") &&
                    !solicitante.getRol().equals("SOPORTE")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permisos");
            }

            List<Map<String, Object>> respuesta = usuarioRepository
                    .findAll()
                    .stream()
                    .filter(u -> u.getRol().equals("SOPORTE") ||
                            u.getRol().equals("ADMIN"))
                    .filter(u -> u.getActivo())
                    .map(u -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", u.getId());
                        map.put("nombre", u.getNombre());
                        map.put("correo", u.getCorreo());
                        map.put("rol", u.getRol());
                        map.put("departamento", u.getDepartamento() != null
                                ? u.getDepartamento().getNombre()
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

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@RequestHeader("Authorization") String authHeader, @PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!usuario.getRol().equals("ADMIN") && !usuario.getRol().equals("SOPORTE")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permisos para esta acción");
            }

            String nuevoEstado = body.get("estado");
            Ticket ticket = ticketService.cambiarEstado(id, nuevoEstado);

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Estado actualizado correctamente");
            respuesta.put("folio", ticket.getFolio());
            respuesta.put("estado", ticket.getEstado());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/prioridad")
    public ResponseEntity<?> cambiarPrioridad(@RequestHeader("Authorization") String authHeader, @PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario usuario = usuarioRepository.findByCorreo(correo).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (!usuario.getRol().equals("ADMIN") && !usuario.getRol().equals("SOPORTE")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permisos para esta acción");
            }

            String nuevaPrioridad = body.get("prioridad");
            Ticket ticket = ticketService.cambiarPrioridad(id, nuevaPrioridad);

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Prioridad actualizada correctamente");
            respuesta.put("folio", ticket.getFolio());
            respuesta.put("prioridad", ticket.getPrioridad());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/imagen")
    public ResponseEntity<?> verImagen(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        try {
            String token = authHeader.substring(7);
            jwtService.extraerCorreo(token);

            Ticket ticket = ticketService.obtenerPorId(id);

            if (ticket.getRutaImagen() == null) {
                return ResponseEntity.notFound().build();
            }

            Path rutaImagen = Paths.get(ticket.getRutaImagen());
            byte[] imagen = Files.readAllBytes(rutaImagen);

            String contentType = ticket.getRutaImagen().endsWith(".png") ? "image/png" : "image/jpeg";

            return ResponseEntity.ok().header("Content-Type", contentType).body(imagen);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    // ── Detalle completo de un ticket ─────────────────────────────────────────
    // Accesible por: el empleado que lo creó, soporte y admin
    @GetMapping("/{id}")
    public ResponseEntity<?> detalleTicket(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario solicitante = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            Map<String, Object> detalle = ticketService.obtenerDetalle(id);

            // El empleado solo puede ver sus propios tickets
            if (solicitante.getRol().equals("EMPLEADO")) {
                Map<String, Object> creadoPor = (Map<String, Object>) detalle.get("creadoPor");
                Long idCreador = ((Number) creadoPor.get("id")).longValue();
                if (!idCreador.equals(solicitante.getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("No tienes acceso a este ticket");
                }
            }

            return ResponseEntity.ok(detalle);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // ── Agregar comentario (con imagen opcional) ───────────────────────────────
    @PostMapping("/{id}/comentario")
    public ResponseEntity<?> agregarComentario(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestParam("texto") String texto,
            @RequestParam("tipo") String tipo,
            @RequestParam(value = "imagen", required = false) MultipartFile imagen) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario usuario = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // Solo soporte/admin pueden agregar comentarios de tipo SOLUCION o RECHAZO
            if (("SOLUCION".equals(tipo) || "RECHAZO".equals(tipo))
                    && usuario.getRol().equals("EMPLEADO")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permisos para este tipo de comentario");
            }

            ticketService.agregarComentario(id, texto, tipo, imagen, usuario);

            return ResponseEntity.ok(Map.of("mensaje", "Comentario agregado correctamente"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/asignar")
    public ResponseEntity<?> asignarTicket(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario solicitante = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (solicitante.getRol().equals("EMPLEADO")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permisos para asignar tickets");
            }

            Ticket ticket = ticketService.asignarTicket(id, body.get("usuarioId"));

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Ticket asignado correctamente");
            respuesta.put("asignadoA", ticket.getAsignadoA().getNombre());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // ── Crear ticket manual (soporte/admin, con fecha y empleado opcionales) ──
    @PostMapping("/manual")
    public ResponseEntity<?> crearTicketManual(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("aplicacion") String aplicacion,
            @RequestParam("problema") String problema,
            @RequestParam("prioridad") String prioridad,
            @RequestParam(value = "imagen", required = false) MultipartFile imagen,
            @RequestParam(value = "empleadoId", required = false) Long empleadoId,
            @RequestParam(value = "fechaCreacion", required = false) String fechaCreacionStr) {
        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);
            Usuario creador = usuarioRepository.findByCorreo(correo)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            if (creador.getRol().equals("EMPLEADO")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No tienes permisos para crear tickets manuales");
            }

            // Parsear la fecha si viene como string (formato "yyyy-MM-ddTHH:mm")
            LocalDateTime fechaManual = (fechaCreacionStr != null && !fechaCreacionStr.isBlank())
                    ? LocalDateTime.parse(fechaCreacionStr)
                    : null;

            Ticket ticket = ticketService.crearTicketManual(
                    aplicacion, problema, prioridad, imagen, creador, empleadoId, fechaManual);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "folio", ticket.getFolio(),
                    "estado", ticket.getEstado(),
                    "fechaCreacion", ticket.getFechaCreacion().toString()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al crear el ticket: " + e.getMessage());
        }
    }

    // ── Imagen del comentario ─────────────────────────────────────────────────
    @GetMapping("/comentario/{comentarioId}/imagen")
    public ResponseEntity<?> imagenComentario(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long comentarioId) {
        try {
            jwtService.extraerCorreo(authHeader.substring(7));

            Comentario comentario = comentarioRepository.findById(comentarioId)
                    .orElseThrow(() -> new RuntimeException("Comentario no encontrado"));

            if (comentario.getRutaImagen() == null) {
                return ResponseEntity.notFound().build();
            }

            Path ruta = Paths.get(comentario.getRutaImagen());
            byte[] imagen = Files.readAllBytes(ruta);
            String contentType = comentario.getRutaImagen().endsWith(".png")
                    ? "image/png" : "image/jpeg";

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .body(imagen);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}
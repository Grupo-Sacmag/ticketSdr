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

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TicketController {

    private final TicketService ticketService;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

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
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
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
}
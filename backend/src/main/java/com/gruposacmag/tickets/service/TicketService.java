package com.gruposacmag.tickets.service;

// ── Modelos ───────────────────────────────────────────────────────────────────
import com.gruposacmag.tickets.model.Comentario;
import com.gruposacmag.tickets.model.Ticket;
import com.gruposacmag.tickets.model.Usuario;

// ── Repositorios ──────────────────────────────────────────────────────────────
import com.gruposacmag.tickets.repository.ComentarioRepository;
import com.gruposacmag.tickets.repository.TicketRepository;
import com.gruposacmag.tickets.repository.UsuarioRepository;
import com.gruposacmag.tickets.repository.AplicacionRepository;

// ── Spring ────────────────────────────────────────────────────────────────────
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

// ── Java ──────────────────────────────────────────────────────────────────────
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final EmailService emailService;
    private final ComentarioRepository comentarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final AplicacionRepository aplicacionRepository;

    private static final String UPLOAD_DIR = "uploads/";

    // ── Métodos existentes (sin cambios) ──────────────────────────────────────

    public List<Ticket> obtenerTicketsPorUsuario(Usuario usuario) {
        return ticketRepository.findByCreadoPorOrderByFechaCreacionDesc(usuario);
    }

    public List<Ticket> obtenerTodos() {
        return ticketRepository.findAllByOrderByFechaCreacionDesc();
    }

    public Ticket obtenerPorId(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));
    }

    public Ticket cambiarEstado(Long id, String nuevoEstado) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));

        ticket.setEstado(nuevoEstado);
        ticket.setFechaActualizacion(LocalDateTime.now());

        if (nuevoEstado.equals("CERRADO") || nuevoEstado.equals("RESUELTO")) {
            ticket.setFechaCierre(LocalDateTime.now());
        }

        Ticket ticketGuardado = ticketRepository.save(ticket);

        // Notificar al empleado que creó el ticket sobre el cambio de estado.
        // @Async en EmailService garantiza que esto no bloquea la respuesta al admin.
        emailService.enviarCambioEstado(ticketGuardado, ticketGuardado.getCreadoPor());

        return ticketGuardado;
    }

    public Ticket cambiarPrioridad(Long id, String nuevaPrioridad) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));
        ticket.setPrioridad(nuevaPrioridad);
        ticket.setFechaActualizacion(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    public Ticket crearTicket(String aplicacion, String problema, String prioridad,
                              MultipartFile imagen, Usuario usuario) throws IOException {
        String folio = generarFolio();
        String rutaImagen = null;
        if (imagen != null && !imagen.isEmpty()) {
            rutaImagen = guardarImagen(imagen, folio);
        }
        Ticket ticket = new Ticket();
        ticket.setFolio(folio);
        ticket.setAplicacion(aplicacion);
        ticket.setProblema(problema);
        ticket.setPrioridad(prioridad);
        ticket.setRutaImagen(rutaImagen);
        ticket.setCreadoPor(usuario);
        // Auto-asignar departamento según la aplicación reportada. Si la aplicación tiene departamento configurado, el ticket, hereda esa responsabilidad automáticamente.
        aplicacionRepository.findByNombre(aplicacion).ifPresent(app -> {
            if (app.getDepartamento() != null) {
                ticket.setDepartamento(app.getDepartamento());
            }
        });
        Ticket ticketGuardado = ticketRepository.save(ticket);
        emailService.enviarNotificacionDesarrollo(ticketGuardado, usuario);
        emailService.enviarConfirmacionEmpleado(ticketGuardado, usuario);
        return ticketGuardado;
    }

    // ── Métodos nuevos ────────────────────────────────────────────────────────

    public Map<String, Object> obtenerDetalle(Long id) {
        Ticket t = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));

        List<Comentario> comentarios = comentarioRepository.findByTicketOrderByFechaAsc(t);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        Map<String, Object> detalle = new HashMap<>();
        detalle.put("id", t.getId());
        detalle.put("folio", t.getFolio());
        detalle.put("aplicacion", t.getAplicacion());
        detalle.put("prioridad", t.getPrioridad());
        detalle.put("estado", t.getEstado());
        detalle.put("problema", t.getProblema());
        detalle.put("tieneImagen", t.getRutaImagen() != null);
        detalle.put("tieneImagenSolucion", t.getRutaImagenSolucion() != null);
        detalle.put("fechaCreacion", t.getFechaCreacion() != null
                ? t.getFechaCreacion().format(fmt) : "");
        detalle.put("fechaActualizacion", t.getFechaActualizacion() != null
                ? t.getFechaActualizacion().format(fmt) : null);
        detalle.put("fechaCierre", t.getFechaCierre() != null
                ? t.getFechaCierre().format(fmt) : null);

        Map<String, Object> creadoPor = new HashMap<>();
        creadoPor.put("id", t.getCreadoPor().getId());
        creadoPor.put("nombre", t.getCreadoPor().getNombre());
        creadoPor.put("correo", t.getCreadoPor().getCorreo());
        detalle.put("creadoPor", creadoPor);

        if (t.getAsignadoA() != null) {
            Map<String, Object> asignado = new HashMap<>();
            asignado.put("id", t.getAsignadoA().getId());
            asignado.put("nombre", t.getAsignadoA().getNombre());
            asignado.put("correo", t.getAsignadoA().getCorreo());
            detalle.put("asignadoA", asignado);
        } else {
            detalle.put("asignadoA", null);
        }

        // Departamento responsable del ticket
        if (t.getDepartamento() != null) {
            detalle.put("departamento", t.getDepartamento().getNombre());
        } else {
            detalle.put("departamento", "Sin asignar");
        }

        List<Map<String, Object>> listaComentarios = comentarios.stream().map(c -> {
            Map<String, Object> com = new HashMap<>();
            com.put("id", c.getId());
            com.put("autor", c.getUsuario().getNombre());
            com.put("rolAutor", c.getUsuario().getRol());
            com.put("texto", c.getTexto());
            com.put("tipo", c.getTipoComentario());
            com.put("tieneImagen", c.getRutaImagen() != null);
            com.put("fecha", c.getFecha().format(fmt));
            return com;
        }).collect(Collectors.toList());

        detalle.put("comentarios", listaComentarios);
        return detalle;
    }

    public Comentario agregarComentario(Long ticketId, String texto, String tipo,
                                        MultipartFile imagen, Usuario autor) throws IOException {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));

        Comentario comentario = new Comentario();
        comentario.setTicket(ticket);
        comentario.setUsuario(autor);
        comentario.setTexto(texto);
        comentario.setTipoComentario(tipo);

        if (imagen != null && !imagen.isEmpty()) {
            String rutaImagen = guardarImagenComentario(imagen, ticketId, tipo);
            comentario.setRutaImagen(rutaImagen);
            if ("SOLUCION".equals(tipo)) {
                ticket.setRutaImagenSolucion(rutaImagen);
                ticketRepository.save(ticket);
            }
        }

        ticket.setFechaActualizacion(LocalDateTime.now());
        ticketRepository.save(ticket);

        return comentarioRepository.save(comentario);
    }

    public Ticket asignarTicket(Long ticketId, Long usuarioId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));
        Usuario asignado = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        ticket.setAsignadoA(asignado);
        ticket.setFechaActualizacion(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    public Ticket crearTicketManual(String aplicacion, String problema, String prioridad,
                                    MultipartFile imagen, Usuario creador,
                                    Long empleadoId, LocalDateTime fechaManual) throws IOException {
        String folio = generarFolio();
        String rutaImagen = null;
        if (imagen != null && !imagen.isEmpty()) {
            rutaImagen = guardarImagen(imagen, folio);
        }
        Usuario propietario = (empleadoId != null)
                ? usuarioRepository.findById(empleadoId)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"))
                : creador;

        Ticket ticket = new Ticket();
        ticket.setFolio(folio);
        ticket.setAplicacion(aplicacion);
        ticket.setProblema(problema);
        ticket.setPrioridad(prioridad);
        ticket.setRutaImagen(rutaImagen);
        ticket.setCreadoPor(propietario);
        aplicacionRepository.findByNombre(aplicacion).ifPresent(app -> {
            if (app.getDepartamento() != null) {
                ticket.setDepartamento(app.getDepartamento());
            }
        });
        ticket.setFechaCreacion(fechaManual != null ? fechaManual : LocalDateTime.now());
        Ticket ticketGuardado = ticketRepository.save(ticket);
        emailService.enviarNotificacionDesarrollo(ticketGuardado, propietario);
        emailService.enviarConfirmacionEmpleado(ticketGuardado, propietario);
        return ticketGuardado;
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private String generarFolio() {
        String anio = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy"));
        long total = ticketRepository.count() + 1;
        return String.format("SACMAG-%s-%04d", anio, total);
    }

    private String guardarImagen(MultipartFile imagen, String folio) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String extension = imagen.getOriginalFilename()
                .substring(imagen.getOriginalFilename().lastIndexOf("."));
        Path rutaArchivo = uploadPath.resolve(folio + extension);
        Files.write(rutaArchivo, imagen.getBytes());
        return rutaArchivo.toString();
    }

    private String guardarImagenComentario(MultipartFile imagen, Long ticketId,
                                           String tipo) throws IOException {
        Path uploadPath = Paths.get("uploads/comentarios/");
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String extension = imagen.getOriginalFilename()
                .substring(imagen.getOriginalFilename().lastIndexOf("."));
        String nombreArchivo = "TKT-" + ticketId + "-" + tipo + "-"
                + System.currentTimeMillis() + extension;
        Path rutaArchivo = uploadPath.resolve(nombreArchivo);
        Files.write(rutaArchivo, imagen.getBytes());
        return rutaArchivo.toString();
    }
}
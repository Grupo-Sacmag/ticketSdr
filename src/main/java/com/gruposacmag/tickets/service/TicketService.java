package com.gruposacmag.tickets.service;

import com.gruposacmag.tickets.model.Ticket;
import com.gruposacmag.tickets.model.Usuario;
import com.gruposacmag.tickets.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final EmailService emailService;

    private static final String UPLOAD_DIR = "uploads/";

    public List<Ticket> obtenerTicketsPorUsuario(Usuario usuario) {
        return ticketRepository.findByCreadoPorOrderByFechaCreacionDesc(usuario);
    }

    public List<Ticket> obtenerTodos() {
        return ticketRepository.findAllByOrderByFechaCreacionDesc();
    }

    public Ticket obtenerPorId(Long id) {
        return ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket no encontrado"));
    }

    public Ticket cambiarEstado(Long id, String nuevoEstado) {
        Ticket ticket = ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket no encontrado"));

        ticket.setEstado(nuevoEstado);
        ticket.setFechaActualizacion(LocalDateTime.now());

        if (nuevoEstado.equals("CERRADO") || nuevoEstado.equals("RESUELTO")) {
            ticket.setFechaCierre(LocalDateTime.now());
        }

        return ticketRepository.save(ticket);
    }

    public Ticket crearTicket(String aplicacion, String problema, String prioridad, MultipartFile imagen,  Usuario usuario) throws IOException {
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

        Ticket ticketGuardado = ticketRepository.save(ticket);

        emailService.enviarNotificacionDesarrollo(ticketGuardado, usuario);
        emailService.enviarConfirmacionEmpleado(ticketGuardado, usuario);

        return ticketGuardado;
    }

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
        String extension = imagen.getOriginalFilename().substring(imagen.getOriginalFilename().lastIndexOf("."));
        String nombreArchivo = folio + extension;
        Path rutaArchivo = uploadPath.resolve(nombreArchivo);
        Files.write(rutaArchivo, imagen.getBytes());
        return rutaArchivo.toString();
    }

    public Ticket cambiarPrioridad(Long id, String nuevaPrioridad) {
        Ticket ticket = ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket no encontrado"));

        ticket.setPrioridad(nuevaPrioridad);
        ticket.setFechaActualizacion(LocalDateTime.now());

        return ticketRepository.save(ticket);
    }
}
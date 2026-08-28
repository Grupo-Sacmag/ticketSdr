package com.gruposacmag.tickets.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ComentariosTickets")
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_ComentariosTickets")
    private Long id;

    // Relación hacia el ticket al que pertenece este comentario
    @ManyToOne
    @JoinColumn(name = "TicketID", nullable = false)
    private Ticket ticket;

    // Quién escribió el comentario
    @ManyToOne
    @JoinColumn(name = "UsuarioID", nullable = false)
    private Usuario usuario;

    @Column(name = "Comentario", nullable = false, length = 2000)
    private String texto;

    // SEGUIMIENTO = cualquier rol, SOLUCION/RECHAZO = solo soporte/admin
    @Column(name = "TipoComentario", nullable = false)
    private String tipoComentario = "SEGUIMIENTO";

    // Captura de solución adjunta al comentario (opcional)
    @Column(name = "RutaImagen")
    private String rutaImagen;

    @Column(name = "Fecha")
    private LocalDateTime fecha = LocalDateTime.now();
}
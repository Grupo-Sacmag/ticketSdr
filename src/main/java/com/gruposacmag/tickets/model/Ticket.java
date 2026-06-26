package com.gruposacmag.tickets.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "Tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Ticket")
    private Long id;

    @Column(name = "Folio", nullable = false, unique = true)
    private String folio;

    @Column(name = "Aplicacion", nullable = false)
    private String aplicacion;

    @Column(name = "ProblemaDetectado", nullable = false, length = 2000)
    private String problema;

    @Column(name = "Prioridad", nullable = false)
    private String prioridad;

    @Column(name = "EstadoTicket", nullable = false)
    private String estado = "ABIERTO";

    @Column(name = "RutaImagen")
    private String rutaImagen;

    @ManyToOne
    @JoinColumn(name = "UsuarioID", nullable = false)
    private Usuario creadoPor;

    @Column(name = "FechaCreacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "FechaActualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "FechaCierre")
    private LocalDateTime fechaCierre;
}
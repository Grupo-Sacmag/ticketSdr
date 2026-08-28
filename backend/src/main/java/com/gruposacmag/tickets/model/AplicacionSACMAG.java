package com.gruposacmag.tickets.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "AplicacionesSACMAG")
public class AplicacionSACMAG {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_AplicacionesSACMAG")
    private Long id;

    @Column(name = "Nombre", nullable = false, unique = true)
    private String nombre;

    @Column(name = "Descripcion")
    private String descripcion;

    @Column(name = "Activa", nullable = false)
    private Boolean activa = true;

    @Column(name = "FechaCreacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    // Relación al departamento responsable de esta aplicación.
    // Cuando se crea un ticket para esta app, el sistema usa este
    // departamento para asignarlo automáticamente.
    @ManyToOne
    @JoinColumn(name = "DepartamentoID")
    private Departamento departamento;
}
package com.gruposacmag.tickets.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "Departamentos")
public class Departamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Departamentos")
    private Long id;

    @Column(name = "Nombre", nullable = false, unique = true)
    private String nombre;

    @Column(name = "Descripcion")
    private String descripcion;

    // Activo=1 → aparece en los selectores; Activo=0 → archivado
    @Column(name = "Activo", nullable = false)
    private Boolean activo = true;
}
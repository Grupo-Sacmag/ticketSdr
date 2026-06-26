package com.gruposacmag.tickets.model;

import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Usuario")
    private Long id;

    @NotBlank
    @Column(name = "NombreUsuario", nullable = false)
    private String nombre;

    @Email
    @NotBlank
    @Column(name = "CorreoUsuario", nullable = false, unique = true)
    private String correo;

    @NotBlank
    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "ROL", nullable = false)
    @Builder.Default
    private String rol = "EMPLEADO";

    @Column(name = "Activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "FechaCreacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();
}
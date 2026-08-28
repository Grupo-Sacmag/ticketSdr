package com.gruposacmag.tickets.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String nombre;
    private String correo;
    private String rol;
    private Boolean passwordTemporal;
}
package com.gruposacmag.tickets.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketRequest {

    @NotBlank(message = "La aplicación es obligatoria")
    private String aplicacion;

    @NotBlank(message = "El problema es obligatorio")
    private String problema;

    @NotBlank(message = "La prioridad es obligatoria")
    private String prioridad;
}
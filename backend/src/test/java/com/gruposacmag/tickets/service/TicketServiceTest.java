package com.gruposacmag.tickets.service;

import com.gruposacmag.tickets.model.Ticket;
import com.gruposacmag.tickets.model.Usuario;
import com.gruposacmag.tickets.repository.AplicacionRepository;
import com.gruposacmag.tickets.repository.ComentarioRepository;
import com.gruposacmag.tickets.repository.TicketRepository;
import com.gruposacmag.tickets.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private ComentarioRepository comentarioRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AplicacionRepository aplicacionRepository;

    @InjectMocks
    private TicketService ticketService;

    private Ticket ticket;

    @BeforeEach
    void setUp() {
        ticket = new Ticket();
        ticket.setId(1L);
        ticket.setEstado("ABIERTO");
        ticket.setPrioridad("MEDIA");
    }

    @Test
    void obtenerPorId_debeRetornarTicketExistente() {
        when(ticketRepository.findById(1L))
                .thenReturn(Optional.of(ticket));

        Ticket resultado = ticketService.obtenerPorId(1L);

        assertNotNull(resultado);
        assertEquals(1L, resultado.getId());

        verify(ticketRepository).findById(1L);
    }

    @Test
    void obtenerPorId_debeLanzarExcepcionCuandoNoExiste() {
        when(ticketRepository.findById(99L))
                .thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> ticketService.obtenerPorId(99L)
        );

        assertEquals("Ticket no encontrado", exception.getMessage());

        verify(ticketRepository).findById(99L);
    }

    @Test
    void cambiarPrioridad_debeActualizarYGuardarTicket() {
        when(ticketRepository.findById(1L))
                .thenReturn(Optional.of(ticket));

        when(ticketRepository.save(ticket))
                .thenReturn(ticket);

        Ticket resultado = ticketService.cambiarPrioridad(1L, "ALTA");

        assertEquals("ALTA", resultado.getPrioridad());

        verify(ticketRepository).findById(1L);
        verify(ticketRepository).save(ticket);
    }
}
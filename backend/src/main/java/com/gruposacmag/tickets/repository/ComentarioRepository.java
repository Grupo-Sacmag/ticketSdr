package com.gruposacmag.tickets.repository;

import com.gruposacmag.tickets.model.Comentario;
import com.gruposacmag.tickets.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {

    // Trae todos los comentarios de un ticket ordenados del más antiguo al más nuevo
    // Así el historial se lee como una conversación cronológica
    List<Comentario> findByTicketOrderByFechaAsc(Ticket ticket);
}
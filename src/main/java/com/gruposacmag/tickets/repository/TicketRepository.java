package com.gruposacmag.tickets.repository;

import com.gruposacmag.tickets.model.Ticket;
import com.gruposacmag.tickets.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByCreadoPorOrderByFechaCreacionDesc(Usuario usuario);
    long countByEstado(String estado);

    List<Ticket> findAllByOrderByFechaCreacionDesc();
}
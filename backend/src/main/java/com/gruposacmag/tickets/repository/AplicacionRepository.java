package com.gruposacmag.tickets.repository;

import com.gruposacmag.tickets.model.AplicacionSACMAG;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AplicacionRepository extends JpaRepository<AplicacionSACMAG, Long> {

    List<AplicacionSACMAG> findByActivaTrueOrderByNombreAsc();

    // Buscar por nombre exacto para la auto-asignación de departamento
    Optional<AplicacionSACMAG> findByNombre(String nombre);
}
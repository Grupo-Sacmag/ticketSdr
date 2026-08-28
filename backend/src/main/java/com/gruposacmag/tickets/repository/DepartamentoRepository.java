package com.gruposacmag.tickets.repository;

import com.gruposacmag.tickets.model.Departamento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DepartamentoRepository extends JpaRepository<Departamento, Long> {

    // Solo los departamentos activos para los selectores del frontend
    List<Departamento> findByActivoTrueOrderByNombreAsc();
}
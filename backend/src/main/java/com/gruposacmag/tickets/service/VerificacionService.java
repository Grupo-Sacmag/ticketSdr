package com.gruposacmag.tickets.service;

import com.gruposacmag.tickets.model.Usuario;
import com.gruposacmag.tickets.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class VerificacionService {

    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    // Genera un código de 6 dígitos, lo guarda en BD y envía por correo
    public void enviarCodigo(Usuario usuario) {
        String codigo = String.format("%06d", new Random().nextInt(999999));
        LocalDateTime expiracion = LocalDateTime.now().plusMinutes(30);

        usuario.setCodigoVerificacion(codigo);
        usuario.setCodigoExpiracion(expiracion);
        usuarioRepository.save(usuario);

        emailService.enviarCodigoVerificacion(usuario, codigo);
    }

    // Verifica que el código sea correcto y no haya expirado
    public boolean verificarCodigo(Usuario usuario, String codigo) {
        if (usuario.getCodigoVerificacion() == null) return false;
        if (usuario.getCodigoExpiracion() == null) return false;
        if (LocalDateTime.now().isAfter(usuario.getCodigoExpiracion())) return false;
        return usuario.getCodigoVerificacion().equals(codigo);
    }

    // Activa la cuenta y limpia el código usado
    public void activarCuenta(Usuario usuario) {
        usuario.setVerificado(true);
        usuario.setCodigoVerificacion(null);
        usuario.setCodigoExpiracion(null);
        usuarioRepository.save(usuario);
    }
}
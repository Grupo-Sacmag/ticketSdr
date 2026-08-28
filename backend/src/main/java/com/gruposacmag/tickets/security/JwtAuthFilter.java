package com.gruposacmag.tickets.security;

import com.gruposacmag.tickets.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;


@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            String correo = jwtService.extraerCorreo(token);

            if (correo != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                var usuarioOpt = usuarioRepository.findByCorreo(correo);

                if (usuarioOpt.isEmpty()) {
                    // El correo del token no existe en BD
                    logger.warn("JWT: usuario no encontrado en BD para correo: {}", correo);
                } else {
                    var usuario = usuarioOpt.get();
                    boolean tokenValido = jwtService.validarToken(token, correo);

                    if (!tokenValido) {
                        // El token expiró o fue manipulado
                        logger.warn("JWT: token inválido para correo: {}", correo);
                    } else {
                        var auth = new UsernamePasswordAuthenticationToken(
                                usuario,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol()))
                        );
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            }
        } catch (Exception e) {
            // Antes este bloque no existía — las excepciones se perdían en silencio
            logger.error("Error en JwtAuthFilter: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }
}
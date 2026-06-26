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

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Leer el header Authorization
        String authHeader = request.getHeader("Authorization");

        // 2. Si no hay token, dejar pasar (Spring Security decidirá después)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extraer el token (quitar el prefijo "Bearer ")
        String token = authHeader.substring(7);
        String correo = jwtService.extraerCorreo(token);

        // 4. Si el token tiene correo y no hay sesión activa aún
        if (correo != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            usuarioRepository.findByCorreo(correo).ifPresent(usuario -> {
                if (jwtService.validarToken(token, correo)) {

                    // 5. Crear la sesión de Spring Security
                    var auth = new UsernamePasswordAuthenticationToken(
                            usuario,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol()))
                    );
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            });
        }

        // 6. Continuar con la petición
        filterChain.doFilter(request, response);
    }
}
package com.gruposacmag.tickets.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private static final String SECRET = "clave-super-secreta-grupo-sacmag-2026-tickets";
    private static final long EXPIRACION = 1000 * 60 * 60 * 8; // 8 horas en milisegundos

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    // Genera un token JWT para un usuario
    public String generarToken(String correo) {
        return Jwts.builder()
                .subject(correo)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRACION))
                .signWith(getKey())
                .compact();
    }

    // Extrae el correo del token
    public String extraerCorreo(String token) {
        return getClaims(token).getSubject();
}

    // Valida que el token sea válido y no haya expirado
    public boolean validarToken(String token, String correo) {
        return extraerCorreo(token).equals(correo) && !estaExpirado(token);
    }

    private boolean estaExpirado(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
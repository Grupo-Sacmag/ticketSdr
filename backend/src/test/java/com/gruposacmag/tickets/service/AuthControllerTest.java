package com.gruposacmag.tickets.service;

import com.gruposacmag.tickets.controller.AuthController;
import com.gruposacmag.tickets.dto.AuthResponse;
import com.gruposacmag.tickets.dto.LoginRequest;
import com.gruposacmag.tickets.model.Usuario;
import com.gruposacmag.tickets.repository.UsuarioRepository;
import com.gruposacmag.tickets.service.EmailService;
import com.gruposacmag.tickets.service.VerificacionService;
import com.gruposacmag.tickets.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private VerificacionService verificacionService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthController authController;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("Usuario Prueba");
        usuario.setCorreo("usuario@test.com");
        usuario.setPassword("password-hash");
        usuario.setRol("EMPLEADO");
        usuario.setActivo(true);
        usuario.setPasswordTemporal(false);
        usuario.setVerificado(true);
    }

    @Test
    void login_debeRetornarTokenCuandoCredencialesSonValidas() {
        LoginRequest request = new LoginRequest();
        request.setCorreo("usuario@test.com");
        request.setPassword("password123");

        when(usuarioRepository.findByCorreo("usuario@test.com"))
                .thenReturn(Optional.of(usuario));

        when(passwordEncoder.matches("password123", "password-hash"))
                .thenReturn(true);

        when(jwtService.generarToken("usuario@test.com"))
                .thenReturn("jwt-token");

        ResponseEntity<?> response = authController.login(request);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertInstanceOf(AuthResponse.class, response.getBody());

        AuthResponse authResponse = (AuthResponse) response.getBody();

        assertEquals("jwt-token", authResponse.getToken());
        assertEquals("Usuario Prueba", authResponse.getNombre());
        assertEquals("usuario@test.com", authResponse.getCorreo());
        assertEquals("EMPLEADO", authResponse.getRol());

        verify(usuarioRepository).findByCorreo("usuario@test.com");
        verify(passwordEncoder).matches("password123", "password-hash");
        verify(jwtService).generarToken("usuario@test.com");
    }

    @Test
    void login_debeRechazarCredencialesIncorrectas() {
        LoginRequest request = new LoginRequest();
        request.setCorreo("usuario@test.com");
        request.setPassword("incorrecta");

        when(usuarioRepository.findByCorreo("usuario@test.com"))
                .thenReturn(Optional.of(usuario));

        when(passwordEncoder.matches("incorrecta", "password-hash"))
                .thenReturn(false);

        ResponseEntity<?> response = authController.login(request);

        assertEquals(401, response.getStatusCode().value());

        verify(usuarioRepository).findByCorreo("usuario@test.com");
        verify(passwordEncoder).matches("incorrecta", "password-hash");
        verify(jwtService, never()).generarToken(anyString());
    }
}
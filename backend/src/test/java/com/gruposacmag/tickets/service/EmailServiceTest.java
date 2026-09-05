package com.gruposacmag.tickets.service;

import com.gruposacmag.tickets.model.Usuario;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailService emailService;

    private Usuario usuario;
    private MimeMessage mimeMessage;

    @BeforeEach
    void setUp() {
        usuario = new Usuario();
        usuario.setNombre("Usuario Prueba");
        usuario.setCorreo("usuario@test.com");

        mimeMessage = new MimeMessage(
                Session.getInstance(new Properties())
        );

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        ReflectionTestUtils.setField(
                emailService,
                "correoRemitente",
                "no-reply@test.com"
        );
    }

    @Test
    void enviarCodigoVerificacion_debeCapturarFalloSMTP() {

        doThrow(new MailSendException("Error SMTP"))
                .when(mailSender)
                .send(any(MimeMessage.class));

        assertDoesNotThrow(() ->
                emailService.enviarCodigoVerificacion(usuario, "123456")
        );

        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }
}
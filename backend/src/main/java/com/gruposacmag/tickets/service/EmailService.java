package com.gruposacmag.tickets.service;

import com.gruposacmag.tickets.model.Ticket;
import com.gruposacmag.tickets.model.Usuario;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;

import java.io.File;

@Service
@RequiredArgsConstructor
@Slf4j  // Genera automáticamente un objeto `log` para registrar eventos (Lombok)
public class EmailService {

    // JavaMailSender es la interfaz de Spring que sabe hablar con el servidor SMTP
    // configurado en application.properties. Spring la inyecta automáticamente.
    private final JavaMailSender mailSender;

    // @Value lee el valor de la propiedad en application.properties en tiempo de arranque
    @Value("${app.mail.desarrollo}")
    private String correoDesarrollo;

    @Value("${spring.mail.username}")
    private String correoRemitente;


    // =========================================================================
    // CORREO 1: Al área de desarrollo — detalles completos + imagen adjunta
    // =========================================================================

    // @Async le dice a Spring: "ejecuta este método en un hilo separado del pool".
    // Beneficio: el usuario recibe la respuesta del API de inmediato (201 Created)
    // sin esperar a que el servidor de correo responda. El correo se manda "en paralelo".
    @Async
    public void enviarNotificacionDesarrollo(Ticket ticket, Usuario usuario) {
        try {
            // MimeMessage es el "sobre" del correo. Soporta HTML, adjuntos, imágenes.
            // (Alternativa básica sería SimpleMailMessage, pero solo texto plano.)
            MimeMessage mensaje = mailSender.createMimeMessage();

            // MimeMessageHelper es el asistente que nos facilita construir el MimeMessage.
            // - true  → habilita modo multipart (necesario para adjuntar archivos)
            // - UTF-8 → codificación para que los acentos se vean bien
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(correoRemitente);
            helper.setTo(correoDesarrollo);
            helper.setSubject("[Tickets SACMAG] Nuevo reporte: " + ticket.getFolio());

            // El segundo argumento `true` le indica al helper que el texto es HTML
            helper.setText(htmlDesarrollo(ticket, usuario), true);

            // ── Adjuntar la imagen si el ticket la tiene ──────────────────────
            // El ticket ya guardó la imagen en disco (TicketService.guardarImagen).
            // rutaImagen contiene algo como "uploads/SACMAG-2026-0002.png"
            if (ticket.getRutaImagen() != null) {
                File archivoImagen = new File(ticket.getRutaImagen());
                if (archivoImagen.exists()) {
                    // FileSystemResource envuelve un File del sistema de archivos
                    // para que JavaMail lo pueda leer y adjuntar al correo.
                    // archivoImagen.getName() → solo el nombre, ej. "SACMAG-2026-0002.png"
                    helper.addAttachment(archivoImagen.getName(),
                            new FileSystemResource(archivoImagen));
                }
            }

            mailSender.send(mensaje);
            // log.info registra en consola sin interrumpir el flujo (es solo informativo)
            log.info("Correo a desarrollo enviado correctamente: {}", ticket.getFolio());

        } catch (MessagingException e) {
            // Si el correo falla, NO queremos que el ticket falle también.
            // Solo registramos el error y seguimos. El ticket ya fue guardado.
            log.error("Error al enviar correo a desarrollo [{}]: {}", ticket.getFolio(), e.getMessage());
        }
    }


    // =========================================================================
    // CORREO 2: Al empleado — confirmación con su folio de seguimiento
    // =========================================================================

    @Async
    public void enviarConfirmacionEmpleado(Ticket ticket, Usuario usuario) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            // Este correo no tiene adjuntos, pero seguimos usando MimeMessage
            // porque necesitamos HTML (para dar formato al folio, colores, etc.)
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(correoRemitente);
            helper.setTo(usuario.getCorreo());
            helper.setSubject("Tu reporte fue recibido · Folio " + ticket.getFolio());
            helper.setText(htmlConfirmacion(ticket, usuario), true);

            mailSender.send(mensaje);
            log.info("Confirmación enviada al empleado: {}", usuario.getCorreo());

        } catch (MessagingException e) {
            log.error("Error al enviar confirmación al empleado [{}]: {}", usuario.getCorreo(), e.getMessage());
        }
    }


    // =========================================================================
    // PLANTILLA HTML — Correo a Desarrollo
    // =========================================================================
    private String htmlDesarrollo(Ticket ticket, Usuario usuario) {
        // Elegimos el color del badge según la prioridad
        String colorPrioridad = switch (ticket.getPrioridad().toUpperCase()) {
            case "ALTA"  -> "#c62828"; // rojo
            case "MEDIA" -> "#e65100"; // naranja
            default      -> "#2e7d32"; // verde (BAJA)
        };

        // ← Agrega estas dos líneas
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaFormateada = ticket.getFechaCreacion().format(formatter);

        // Nota importante sobre %% :
        // String.formatted() usa % como carácter especial (%s, %d, etc.)
        // Entonces cualquier % que QUEREMOS que aparezca en el HTML final
        // (como width="100%") debe escribirse como %% aquí dentro.
        // Java convierte %% → % al hacer el formatted().
        String notaImagen = ticket.getRutaImagen() != null
                ? "<p style='margin:16px 0 0;font-size:13px;color:#555;'>📎 La captura de pantalla se adjunta a este correo.</p>"
                : "";

        return """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                    <tr>
                      <td style="background:#1a237e;padding:28px 32px;">
                        <p style="margin:0;color:#c5cae9;font-size:12px;letter-spacing:1px;text-transform:uppercase;">
                          Sistema de Tickets · Grupo SACMAG
                        </p>
                        <h1 style="margin:8px 0 0;color:#fff;font-size:22px;">Nuevo Ticket Recibido</h1>
                      </td>
                    </tr>

                    <tr>
                      <td style="background:#e8eaf6;padding:16px 32px;">
                        <p style="margin:0;font-size:12px;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;">
                          Folio de seguimiento
                        </p>
                        <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#1a237e;letter-spacing:2px;">
                          %s
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:28px 32px;">
                        <table width="100%%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="50%%" style="padding-bottom:20px;vertical-align:top;">
                              <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Reportado por</p>
                              <p style="margin:6px 0 2px;font-size:15px;color:#222;">%s</p>
                              <p style="margin:0;font-size:13px;color:#666;">%s</p>
                            </td>
                            <td width="50%%" style="padding-bottom:20px;vertical-align:top;">
                              <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Aplicación</p>
                              <p style="margin:6px 0 0;font-size:15px;color:#222;">%s</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:20px;vertical-align:top;">
                              <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Prioridad</p>
                              <p style="margin:6px 0 0;font-size:15px;font-weight:bold;color:%s;">%s</p>
                            </td>
                            <td style="padding-bottom:20px;vertical-align:top;">
                              <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Fecha</p>
                              <p style="margin:6px 0 0;font-size:15px;color:#222;">%s</p>
                            </td>
                          </tr>
                        </table>

                        <hr style="border:none;border-top:1px solid #eee;margin:0 0 20px;">

                        <p style="margin:0;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">
                          Problema reportado
                        </p>
                        <p style="margin:10px 0 0;font-size:15px;color:#333;line-height:1.7;
                                   background:#f9f9f9;padding:16px;border-radius:6px;
                                   border-left:4px solid #1a237e;">
                          %s
                        </p>
                        %s
                      </td>
                    </tr>

                    <tr>
                      <td style="background:#f5f5f5;padding:16px 32px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#aaa;">
                          Mensaje automático — Sistema de Tickets · Grupo SACMAG
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                ticket.getFolio(),          // %s — folio badge
                usuario.getNombre(),        // %s — nombre del empleado
                usuario.getCorreo(),        // %s — correo del empleado
                ticket.getAplicacion(),     // %s — aplicación
                colorPrioridad,             // %s — color CSS de prioridad
                ticket.getPrioridad(),      // %s — texto de prioridad
                fechaFormateada,            // %s — fecha con formato específico
                ticket.getProblema(),       // %s — descripción del problema
                notaImagen                  // %s — nota de adjunto (o vacío)
        );
    }


    // =========================================================================
    // PLANTILLA HTML — Confirmación al Empleado
    // =========================================================================
    private String htmlConfirmacion(Ticket ticket, Usuario usuario) {
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                         style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                    <tr>
                      <td style="background:#1a237e;padding:28px 32px;">
                        <p style="margin:0;color:#c5cae9;font-size:12px;letter-spacing:1px;text-transform:uppercase;">
                          Sistema de Tickets · Grupo SACMAG
                        </p>
                        <h1 style="margin:8px 0 0;color:#fff;font-size:22px;">✅ Reporte Recibido</h1>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:28px 32px 0;">
                        <p style="margin:0;font-size:16px;color:#333;">
                          Hola, <strong>%s</strong>.
                        </p>
                        <p style="margin:10px 0 0;font-size:15px;color:#555;line-height:1.6;">
                          Hemos recibido tu reporte correctamente.
                          El equipo de desarrollo lo atenderá a la brevedad.
                          Guarda tu folio de seguimiento:
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:20px 32px;">
                        <div style="background:#e8eaf6;border-radius:8px;padding:20px;text-align:center;">
                          <p style="margin:0;font-size:12px;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;">
                            Folio de seguimiento
                          </p>
                          <p style="margin:8px 0 0;font-size:30px;font-weight:bold;color:#1a237e;letter-spacing:3px;">
                            %s
                          </p>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:0 32px 28px;">
                        <p style="margin:0 0 12px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;">
                          Resumen de tu reporte
                        </p>
                        <table width="100%%" cellpadding="10" cellspacing="0"
                               style="border:1px solid #eee;border-radius:6px;font-size:14px;border-collapse:collapse;">
                          <tr style="background:#f9f9f9;">
                            <td style="color:#888;width:120px;border-bottom:1px solid #eee;">Aplicación</td>
                            <td style="color:#333;border-bottom:1px solid #eee;">%s</td>
                          </tr>
                          <tr>
                            <td style="color:#888;border-bottom:1px solid #eee;">Prioridad</td>
                            <td style="color:#333;border-bottom:1px solid #eee;">%s</td>
                          </tr>
                          <tr style="background:#f9f9f9;">
                            <td style="color:#888;vertical-align:top;">Descripción</td>
                            <td style="color:#333;line-height:1.6;">%s</td>
                          </tr>
                        </table>
                        <p style="margin:16px 0 0;font-size:12px;color:#aaa;">
                          Mensaje automático, por favor no responder directamente a este correo.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="background:#f5f5f5;padding:16px 32px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#aaa;">
                          Mensaje automático — Sistema de Tickets · Grupo SACMAG
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                usuario.getNombre(),     // %s — saludo personalizado
                ticket.getFolio(),       // %s — folio grande
                ticket.getAplicacion(),  // %s — fila tabla
                ticket.getPrioridad(),   // %s — fila tabla
                ticket.getProblema()     // %s — fila tabla
        );
    }

    public void enviarCodigoVerificacion(Usuario usuario, String codigo) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(correoRemitente);
            helper.setTo(usuario.getCorreo());
            helper.setSubject("Código de verificación — Sistema de Tickets SACMAG");

            String html = """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;">
              <h2 style="color:#1a1a2e;">Verifica tu cuenta</h2>
              <p>Hola <strong>%s</strong>, usa el siguiente código para activar tu cuenta:</p>
              <div style="font-size:2.5rem;font-weight:bold;letter-spacing:0.5rem;
                          color:#1a1a2e;background:#f0f2f5;padding:1rem;
                          border-radius:8px;text-align:center;margin:1.5rem 0;">
                %s
              </div>
              <p style="color:#666;font-size:0.9rem;">
                Este código expira en <strong>30 minutos</strong>.<br/>
                Si no solicitaste esto, ignora este mensaje.
              </p>
              <hr/>
              <p style="font-size:0.8rem;color:#999;">Sistema de Tickets — Grupo SACMAG</p>
            </div>
            """.formatted(usuario.getNombre(), codigo);

            helper.setText(html, true);
            mailSender.send(mensaje);

        } catch (Exception e) {
            System.out.println("Error enviando código de verificación: " + e.getMessage());
        }
    }

    // =========================================================================
// CORREO 4: Al empleado — notificación de cambio de estado
// =========================================================================
    @Async
    public void enviarCambioEstado(Ticket ticket, Usuario empleado) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(correoRemitente);
            helper.setTo(empleado.getCorreo());
            helper.setSubject("Actualización en tu ticket · " + ticket.getFolio());
            helper.setText(htmlCambioEstado(ticket, empleado), true);

            mailSender.send(mensaje);
            log.info("Notificación de cambio de estado enviada a: {}", empleado.getCorreo());

        } catch (MessagingException e) {
            log.error("Error al enviar notificación de estado [{}]: {}",
                    ticket.getFolio(), e.getMessage());
        }
    }

    // =========================================================================
// PLANTILLA HTML — Cambio de estado al empleado
// =========================================================================
    private String htmlCambioEstado(Ticket ticket, Usuario empleado) {

        // Color e icono según el nuevo estado
        String colorEstado = switch (ticket.getEstado()) {
            case "EN PROCESO" -> "#e65100";
            case "RESUELTO"   -> "#2e7d32";
            case "CERRADO"    -> "#546e7a";
            default           -> "#1565c0"; // ABIERTO
        };
        String iconoEstado = switch (ticket.getEstado()) {
            case "EN PROCESO" -> "🔧";
            case "RESUELTO"   -> "✅";
            case "CERRADO"    -> "🔒";
            default           -> "📋";
        };
        String mensajeEstado = switch (ticket.getEstado()) {
            case "EN PROCESO" ->
                    "Tu ticket ha sido tomado por el equipo de soporte y está siendo atendido.";
            case "RESUELTO"   ->
                    "El equipo de soporte ha marcado tu ticket como resuelto. " +
                            "Revisa los comentarios para ver la solución aplicada.";
            case "CERRADO"    ->
                    "Tu ticket ha sido cerrado. Si el problema persiste, no dudes en abrir uno nuevo.";
            default           ->
                    "El estado de tu ticket ha sido actualizado.";
        };

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaActualizacion = ticket.getFechaActualizacion() != null
                ? ticket.getFechaActualizacion().format(fmt)
                : ticket.getFechaCreacion().format(fmt);

        return """
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0"
                 style="background:#f4f6f8;padding:32px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#fff;border-radius:10px;overflow:hidden;
                            box-shadow:0 2px 8px rgba(0,0,0,0.08);">

                <tr>
                  <td style="background:#1a237e;padding:28px 32px;">
                    <p style="margin:0;color:#c5cae9;font-size:12px;
                               letter-spacing:1px;text-transform:uppercase;">
                      Sistema de Tickets · Grupo SACMAG
                    </p>
                    <h1 style="margin:8px 0 0;color:#fff;font-size:22px;">
                      %s Actualización de ticket
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="background:#e8eaf6;padding:16px 32px;">
                    <p style="margin:0;font-size:12px;color:#5c6bc0;
                               text-transform:uppercase;letter-spacing:1px;">
                      Folio
                    </p>
                    <p style="margin:4px 0 0;font-size:24px;font-weight:bold;
                               color:#1a237e;letter-spacing:2px;">
                      %s
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px 32px;">
                    <p style="margin:0;font-size:16px;color:#333;">
                      Hola, <strong>%s</strong>.
                    </p>
                    <p style="margin:12px 0 0;font-size:15px;color:#555;line-height:1.6;">
                      %s
                    </p>

                    <div style="margin:24px 0;padding:16px 20px;border-radius:8px;
                                background:#f9f9f9;border-left:4px solid %s;">
                      <p style="margin:0;font-size:12px;color:#999;
                                 text-transform:uppercase;letter-spacing:1px;">
                        Nuevo estado
                      </p>
                      <p style="margin:6px 0 0;font-size:20px;font-weight:bold;color:%s;">
                        %s %s
                      </p>
                    </div>

                    <table width="100%%" cellpadding="10" cellspacing="0"
                           style="border:1px solid #eee;border-radius:6px;
                                  font-size:14px;border-collapse:collapse;">
                      <tr style="background:#f9f9f9;">
                        <td style="color:#888;width:140px;border-bottom:1px solid #eee;">
                          Aplicación
                        </td>
                        <td style="color:#333;border-bottom:1px solid #eee;">
                          %s
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#888;border-bottom:1px solid #eee;">
                          Prioridad
                        </td>
                        <td style="color:#333;border-bottom:1px solid #eee;">
                          %s
                        </td>
                      </tr>
                      <tr style="background:#f9f9f9;">
                        <td style="color:#888;">Actualizado</td>
                        <td style="color:#333;">%s</td>
                      </tr>
                    </table>

                    <p style="margin:20px 0 0;font-size:13px;color:#888;">
                      Si tienes dudas sobre esta actualización, comunícate con el equipo
                      de soporte directamente.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f5f5f5;padding:16px 32px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#aaa;">
                      Mensaje automático — Sistema de Tickets · Grupo SACMAG
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """.formatted(
                iconoEstado,            // %s — icono encabezado
                ticket.getFolio(),      // %s — folio
                empleado.getNombre(),   // %s — saludo
                mensajeEstado,          // %s — mensaje descriptivo
                colorEstado,            // %s — color borde izquierdo
                colorEstado,            // %s — color texto estado
                iconoEstado,            // %s — icono estado
                ticket.getEstado(),     // %s — texto estado
                ticket.getAplicacion(), // %s — aplicación
                ticket.getPrioridad(),  // %s — prioridad
                fechaActualizacion      // %s — fecha
        );
    }
}
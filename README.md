# Sistema de Tickets SACMAG

Un sistema web completo para la gestión y seguimiento de incidencias y reportes de aplicaciones internas del **Grupo SACMAG**. El proyecto cuenta con una arquitectura desacoplada conformada por un **Backend en Spring Boot** y un **Frontend en React**.

---

## 🚀 Características Principales

*   **Autenticación y Autorización Segura:** Registro e inicio de sesión protegidos mediante JSON Web Tokens (JWT) y Spring Security.
*   **Roles de Usuario:**
    *   `EMPLEADO`: Puede reportar nuevos tickets (indicando aplicación, descripción del problema, prioridad y una captura de pantalla opcional) y dar seguimiento a sus reportes (`Mis Tickets`).
    *   `SOPORTE`: Acceso al tablero general para actualizar el estado (`ABIERTO`, `EN_PROCESO`, `RESUELTO`, `CERRADO`) y la prioridad de los tickets.
    *   `ADMIN`: Posee todos los privilegios de Soporte y además administra a los usuarios (cambiar roles, activar/desactivar cuentas).
*   **Carga de Evidencia Visual:** Soporte para adjuntar capturas de pantalla (imágenes `.png`/`.jpg`) al reportar un ticket. Las imágenes se almacenan localmente en el servidor y se sirven mediante un endpoint seguro.
*   **Notificaciones Asíncronas por Correo:** Envío de correos electrónicos automatizados (a través de SMTP de Gmail usando `@Async` para optimizar la velocidad de respuesta):
    1.  **A Desarrollo:** Notificación detallada con la información del problema y la imagen de evidencia como archivo adjunto.
    2.  **Al Empleado:** Confirmación de recepción con el número de folio generado para su seguimiento.
*   **Generación Automática de Folio:** Genera folios secuenciales formateados por año (ej. `SACMAG-2026-0001`).

---

## 🛠️ Tecnologías Utilizadas

### Backend (API)
*   **Lenguaje:** Java 21
*   **Framework:** Spring Boot 3.5.14
*   **Seguridad:** Spring Security y JWT (`io.jsonwebtoken`)
*   **Persistencia:** Spring Data JPA con Hibernate (Estrategia de nombrado físico estándar)
*   **Base de Datos:** Microsoft SQL Server
*   **Gestión de Correo:** Spring Boot Starter Mail (JavaMailSender)
*   **Productividad:** Project Lombok

### Frontend
*   **Framework de UI:** React 19 (JavaScript)
*   **Herramienta de Construcción:** Vite 8
*   **Enrutamiento:** React Router DOM v7
*   **Estilos:** CSS Vanilla (a la medida, responsivo)
*   **Peticiones HTTP:** Fetch API / Axios

---

## 📁 Estructura del Repositorio

```text
ticketSdr-git/
│
├── database/
│   └── ScriptSistemaDeTickets.sql      # Script de inicialización de la Base de Datos SQL Server
│
├── src/main/java/com/gruposacmag/tickets/
│   ├── controller/                     # Controladores REST (Auth, Tickets)
│   ├── dto/                            # Objetos de Transferencia de Datos (Requests y Responses)
│   ├── model/                          # Entidades JPA (Usuario, Ticket)
│   ├── repository/                     # Interfaces de Acceso a Datos (Spring Data JPA)
│   ├── security/                       # Configuración de Seguridad, Filtro y Servicio JWT
│   ├── service/                        # Lógica de Negocio (TicketService, EmailService)
│   └── TicketsApplication.java         # Clase Principal del Backend
│
├── src/main/resources/
│   └── application.properties          # Configuración del Backend (DB, SMTP, Puertos)
│
├── tickets-frontend/                   # Código Fuente del Cliente React
│   ├── src/
│   │   ├── api/                        # Cliente de conexión al backend (tickets.js)
│   │   ├── components/                 # Componentes reutilizables (Navbar, RutaProtegida)
│   │   ├── pages/                      # Vistas principales (Login, Register, Dashboard, etc.)
│   │   ├── App.jsx                     # Enrutamiento de la aplicación
│   │   └── main.jsx                    # Punto de entrada de React
│   ├── package.json                    # Dependencias y scripts de Node.js
│   └── vite.config.js                  # Configuración de Vite
│
└── uploads/                            # Carpeta local para almacenar capturas de pantalla de los tickets
```

---

## ⚙️ Configuración y Despliegue

### 1. Requisitos Previos
*   **Java JDK 21** o superior instalado.
*   **Node.js** (versión 18 o superior) y **npm**.
*   Instancia activa de **Microsoft SQL Server**.
*   Una cuenta de correo para envío SMTP (ej. cuenta de Gmail con *Contraseña de Aplicación* configurada).

### 2. Configuración de la Base de Datos
1.  Abra su herramienta de base de datos (como SQL Server Management Studio).
2.  Ejecute las consultas contenidas en [ScriptSistemaDeTickets.sql](file:///c:/Users/david.albino/Desktop/ticketSdr-git/database/ScriptSistemaDeTickets.sql). Este script:
    *   Crea la base de datos `TicketsSACMAG`.
    *   Crea el login/usuario `UsuarioTicketDesarrollo` con contraseña `Rev$1597!`.
    *   Crea las tablas `Departamentos`, `Usuarios`, `Tickets`, `ComentariosTickets`, `HistorialTickets` y `AplicacionesSACMAG`.
    *   Inserta los datos iniciales para los catálogos de departamentos y aplicaciones.

### 3. Configuración del Backend
Modifique el archivo [application.properties](file:///c:/Users/david.albino/Desktop/ticketSdr-git/src/main/resources/application.properties) si requiere cambiar credenciales o detalles de host:
```properties
# Conexión SQL Server
spring.datasource.url=jdbc:sqlserver://<HOST_BD>;databaseName=TicketsSACMAG;encrypt=true;trustServerCertificate=true
spring.datasource.username=UsuarioTicketDesarrollo
spring.datasource.password=Rev$1597!

# Configuración SMTP de Gmail (Reemplazar con sus credenciales reales)
spring.mail.username=sacmag.proveedores@gmail.com
spring.mail.password=jvwezvognvounmdl
app.mail.desarrollo=desarrollo.conta@grupo-sacmag.com.mx
```

### 4. Configuración del Frontend
Si el backend se despliega en un puerto o servidor diferente de `http://localhost:8080`, modifique la URL base en el archivo [tickets.js](file:///c:/Users/david.albino/Desktop/ticketSdr-git/tickets-frontend/src/api/tickets.js):
```javascript
const BASE_URL = 'http://localhost:8080/api'
```

---

## 🏃 Cómo Ejecutar el Proyecto

### Ejecutar el Backend (Spring Boot)
Abra una terminal en la raíz del proyecto (`ticketSdr-git`) y ejecute:
```bash
# En Windows (CMD / PowerShell)
./mvnw.cmd spring-boot:run

# En Linux / macOS
./mvnw spring-boot:run
```
El servidor backend iniciará en el puerto `8080`.

### Ejecutar el Frontend (React + Vite)
Abra otra terminal en el directorio del frontend (`ticketSdr-git/tickets-frontend`):
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```
La aplicación cliente estará disponible en la URL indicada por la terminal (usualmente `http://localhost:5173`).

import { Metadata } from 'next'
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from '@/lib/legal-config'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | MaestrIA',
  description: 'Términos y condiciones de uso de la plataforma MaestrIA.',
}

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 prose prose-stone dark:prose-invert">
      <h1>Términos y Condiciones de Uso</h1>
      <p className="text-muted-foreground">Última actualización: {LEGAL_LAST_UPDATED}</p>

      <section className="mt-8">
        <h2>1. Aceptación de los Términos</h2>
        <p>
          Al acceder y utilizar la plataforma <strong>MaestrIA</strong> (&quot;la Plataforma&quot;, &quot;nosotros&quot;), usted acepta 
          quedar vinculado por los presentes Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de 
          estos términos, no debe utilizar la plataforma.
        </p>
      </section>

      <section>
        <h2>2. Descripción del Servicio</h2>
        <p>
          MaestrIA es una herramienta de tecnología educativa asistida por Inteligencia Artificial diseñada para generar 
          cuestionarios, adaptar contenidos pedagógicos y brindar retroalimentación tanto a docentes como a alumnos.
        </p>
      </section>

      <section>
        <h2>3. Roles y Responsabilidades del Usuario</h2>
        
        <h3>3.1. Docentes e Instituciones</h3>
        <p>
          Los <strong>Docentes</strong> son usuarios registrados responsables de la creación y administración de sus &quot;aulas&quot;. 
          El Docente se compromete a:
        </p>
        <ul>
          <li>Proporcionar información precisa al registrarse.</li>
          <li>Ser responsable por el contenido base y los temas (tópicos) que seleccione para enseñar mediante la Plataforma.</li>
          <li><strong>Obtener el consentimiento parental:</strong> Garantizar que cuenta con la debida autorización de la Institución Educativa o el consentimiento expreso de los padres/tutores de los menores para invitarlos a participar en el aula de MaestrIA, eximiendo a la Plataforma de cualquier reclamo por omisión de este deber.</li>
        </ul>

        <h3>3.2. Alumnos (Menores de Edad) e Invitados</h3>
        <p>
          Los <strong>Alumnos</strong> acceden a la Plataforma de dos maneras posibles: a través de una sesión de
          invitado (&quot;Guest Session&quot;) mediante un código provisto por su Docente —que es la vía recomendada
          para el uso escolar y no requiere correo electrónico—, o bien creando una <strong>cuenta propia</strong>
          con autenticación de Google. Los Alumnos se comprometen a:
        </p>
        <ul>
          <li>Utilizar la Plataforma exclusivamente para fines educativos.</li>
          <li><strong>No ingresar datos personales:</strong> Se les solicita expresamente no ingresar datos personales sensibles, información de contacto, direcciones, ni datos identificables propios o de terceros en las cajas de texto de respuesta a los cuestionarios o al interactuar con el asistente de IA.</li>
          <li><strong>Contar con autorización para registrarse:</strong> Si el Alumno es menor de edad y opta por crear una cuenta propia en lugar de ingresar como invitado, debe hacerlo con el conocimiento y la autorización de sus padres, tutores o representantes legales, quienes asumen la supervisión de ese uso. La Plataforma no dispone de un mecanismo de verificación de edad.</li>
        </ul>
      </section>

      <section>
        <h2>4. Uso Aceptable y Restricciones</h2>
        <p>
          Usted acepta no utilizar la Plataforma para:
        </p>
        <ul>
          <li>Fines ilícitos, engañosos o malintencionados.</li>
          <li>Ingresar lenguaje ofensivo, discriminatorio o inapropiado en los prompts o campos de respuesta.</li>
          <li>Intentar vulnerar, interferir o sobrecargar la infraestructura tecnológica y de Inteligencia Artificial (abuso de generación de consultas).</li>
          <li>Realizar ingeniería inversa de la plataforma o extraer su código fuente.</li>
        </ul>
        <p>
          Nos reservamos el derecho de suspender o cancelar cuentas de docentes, o invalidar sesiones de alumnos, 
          que infrinjan estas normas de uso.
        </p>
      </section>

      <section>
        <h2>5. Propiedad Intelectual</h2>
        <p>
          La estructura de la Plataforma, su código fuente, diseño, interfaces, algoritmos subyacentes e integraciones con IA 
          son propiedad exclusiva de MaestrIA. 
        </p>
        <p>
          El <strong>contenido educativo generado</strong> por la IA y los reportes de analíticas quedan a disposición del Docente 
          para su uso exclusivo dentro del ámbito escolar. MaestrIA retiene una licencia no exclusiva, anonimizada y 
          libre de regalías para almacenar y procesar estas interacciones con el fin de mejorar el rendimiento del servicio.
        </p>
      </section>

      <section>
        <h2>6. Limitación de Responsabilidad</h2>
        <p>
          Si bien MaestrIA utiliza Inteligencia Artificial avanzada, los resultados, explicaciones y calificaciones generados 
          por la IA pueden contener imprecisiones o &quot;alucinaciones&quot;. <strong>La Plataforma actúa como una herramienta de apoyo 
          docente y no reemplaza el criterio pedagógico humano.</strong> El Docente es el responsable último de revisar el 
          material.
        </p>
        <p>
          En la máxima medida permitida por la ley aplicable en la República Argentina, MaestrIA no será responsable de 
          daños directos, indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de uso del servicio.
        </p>
      </section>

      <section>
        <h2>7. Modificaciones a los Términos</h2>
        <p>
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigencia 
          a partir de su publicación en esta sección.
        </p>
      </section>

      <section>
        <h2>8. Jurisdicción y Ley Aplicable</h2>
        <p>
          Los presentes Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes de la 
          <strong>República Argentina</strong>. Cualquier controversia derivada de la aplicación, interpretación o 
          ejecución de los mismos, será sometida a la jurisdicción de los Tribunales Ordinarios competentes correspondientes 
          al domicilio del responsable de la Plataforma.
        </p>
        <p>
          <strong>Contacto:</strong> Para cualquier consulta relacionada con estos Términos, comuníquese a <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-primary hover:underline">{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </section>
    </div>
  )
}

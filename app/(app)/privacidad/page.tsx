import { Metadata } from 'next'
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED } from '@/lib/legal-config'

export const metadata: Metadata = {
  title: 'Política de Privacidad | MaestrIA',
  description: 'Política de tratamiento de datos personales de MaestrIA, conforme a la Ley 25.326 de la República Argentina.',
}

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 prose prose-stone dark:prose-invert">
      <h1>Política de Privacidad y Tratamiento de Datos Personales</h1>
      <p className="text-muted-foreground">Última actualización: {LEGAL_LAST_UPDATED}</p>

      <section className="mt-8">
        <h2>1. Identidad del Responsable</h2>
        <p>
          En <strong>MaestrIA</strong> (&quot;la Plataforma&quot;, &quot;nosotros&quot;) estamos comprometidos con la protección de la privacidad
          y los datos personales de nuestros usuarios. La presente Política de Privacidad describe cómo recopilamos,
          utilizamos y protegemos la información en cumplimiento estricto con la Ley N° 25.326 de Protección de los Datos
          Personales de la República Argentina y normativas concordantes de la Agencia de Acceso a la Información Pública (AAIP).
        </p>
      </section>

      <section>
        <h2>2. Datos Recopilados y Finalidad</h2>
        <p>
          La plataforma distingue <strong>tres</strong> tipos de usuarios, y en consecuencia, tres tratamientos de datos
          distintos. La diferencia relevante no es el rol pedagógico sino <em>si el usuario tiene o no una cuenta</em>:
          un alumno puede usar MaestrIA de las dos maneras.
        </p>

        <h3>2.1. Docentes (usuarios registrados)</h3>
        <p>
          Los docentes se registran mediante autenticación de terceros (OAuth de Google). Para la creación de su cuenta,
          recopilamos su <strong>nombre, apellido y dirección de correo electrónico</strong>.
          <br/><strong>Finalidad:</strong> Administrar sus aulas, guardar la configuración pedagógica, emitir reportes
          de progreso de sus alumnos y gestionar la plataforma.
        </p>

        <h3>2.2. Alumnos con cuenta propia (usuarios registrados)</h3>
        <p>
          Un alumno también puede crear una cuenta propia con OAuth de Google, en lugar de entrar como invitado.
          En ese caso recopilamos los mismos datos que para un docente —<strong>nombre y dirección de correo
          electrónico</strong>— más el <strong>nivel educativo y el grado o año</strong> que la persona declara al
          configurar su perfil, que usamos para adecuar el vocabulario y la dificultad del material generado.
        </p>
        <ul>
          <li>
            <strong>Advertencia sobre menores de edad:</strong> esta vía implica entregar una dirección de correo
            electrónico, que es un dato personal identificante. Si la persona que se registra es menor de edad,
            la cuenta debe ser creada <strong>con la intervención y el consentimiento de sus padres, tutores o
            representantes legales</strong>, en los términos de la sección 3.
          </li>
          <li>
            <strong>Alternativa recomendada para menores:</strong> para el uso escolar dentro de un aula, la vía de
            invitado descripta en 2.3 no requiere correo electrónico y es la que recomendamos.
          </li>
          <li>
            <strong>Vinculación de sesiones:</strong> si un alumno que venía usando la plataforma como invitado
            crea después una cuenta, su actividad previa puede quedar asociada a esa cuenta para no perder su
            historial de progreso.
          </li>
        </ul>

        <h3>2.3. Alumnos Invitados (Guest Session)</h3>
        <p>
          MaestrIA opera bajo el principio de <strong>minimización de datos</strong> para los alumnos.
          Los alumnos acceden a las aulas creadas por sus docentes mediante un código, operando como &quot;Invitados&quot;,
          <strong> sin crear ninguna cuenta</strong>.
        </p>
        <ul>
          <li><strong>Datos recolectados:</strong> Nombre de pila o seudónimo proporcionado por el alumno, respuestas a los cuestionarios, interacciones con nuestra Inteligencia Artificial (dudas, consultas pedagógicas) y métricas de desempeño.</li>
          <li><strong>Datos excluidos:</strong> No solicitamos correo electrónico, teléfono ni información personal sensible.</li>
          <li><strong>Mecanismo técnico:</strong> La sesión del invitado se sostiene mediante una cookie en el navegador del usuario que contiene un identificador interno <em>firmado criptográficamente</em> (HMAC-SHA256). La firma impide que el identificador sea alterado o falsificado por terceros; no es un mecanismo de cifrado, y la cookie no contiene el nombre del alumno ni ningún otro dato personal. La actividad queda asociada únicamente a ese identificador, al alias elegido y al código del aula.</li>
        </ul>
        <p>
          <strong>Finalidad:</strong> Brindar feedback pedagógico automatizado, generar reportes de progreso para el docente y adaptar los cuestionarios según el desempeño.
        </p>
      </section>

      <section>
        <h2>3. Consentimiento y Responsabilidad de las Instituciones</h2>
        <p>
          El acceso a MaestrIA por parte de menores de edad (Alumnos) se realiza, en su supuesto habitual, en el marco de
          una actividad educativa dirigida.
          <strong> El Docente y/o la Institución Educativa</strong> que crea el aula virtual en MaestrIA e invita a sus alumnos,
          asume la responsabilidad de haber recabado el consentimiento expreso, libre e informado de los padres, tutores o
          representantes legales de los menores, de acuerdo con el Código Civil y Comercial de la Nación y la normativa de la AAIP.
        </p>
        <p>
          <strong>Registro por fuera de un aula.</strong> Cuando un menor de edad crea una cuenta propia por iniciativa
          individual (sección 2.2), sin la intermediación de un docente, ese consentimiento debe ser prestado por sus
          padres, tutores o representantes legales, quienes son responsables de supervisar el uso de la plataforma.
          MaestrIA no cuenta con un mecanismo técnico que permita verificar de forma fehaciente la edad declarada ni la
          identidad de quien presta el consentimiento. Si tomamos conocimiento de que se creó una cuenta de un menor sin
          la debida autorización, procederemos a suprimir los datos asociados a solicitud de su representante legal, por
          el canal indicado en la sección 6.
        </p>
      </section>

      <section>
        <h2>4. Uso de Inteligencia Artificial (IA)</h2>
        <p>
          MaestrIA utiliza <strong>proveedores de Inteligencia Artificial de terceros</strong> para generar preguntas, 
          explicaciones y brindar asistencia pedagógica (Tutor IA). 
        </p>
        <p>
          <strong>Protección de información:</strong> Solo transmitimos a estos proveedores el texto estricto de la pregunta, 
          la respuesta del alumno o su duda pedagógica. <strong>No transmitimos</strong> nombres, correos electrónicos, ni ningún 
          otro dato que permita identificar de forma directa a la persona física que realiza la consulta, garantizando el anonimato 
          en el procesamiento de la IA.
        </p>
      </section>

      <section>
        <h2>5. Seguridad de los Datos</h2>
        <p>
          Implementamos medidas técnicas y organizativas de seguridad razonables para proteger los datos personales 
          contra accesos no autorizados, pérdida, destrucción o alteración, incluyendo cifrado en tránsito (HTTPS) 
          y firmas criptográficas en las sesiones de usuario.
        </p>
      </section>

      <section>
        <h2>6. Derechos ARCO (Acceso, Rectificación, Actualización y Supresión)</h2>
        <p>
          El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita
          a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto (art. 14, inc. 3 de la Ley Nº 25.326).
          Asimismo, tiene derecho a solicitar la rectificación, actualización o supresión de sus datos.
        </p>
        <ul>
          <li><strong>Docentes y Alumnos con cuenta propia:</strong> Pueden ejercer sus derechos escribiendo desde la casilla de correo asociada a su cuenta, lo que nos permite verificar su identidad.</li>
          <li><strong>Representantes legales de un menor con cuenta propia:</strong> Pueden solicitar el acceso, la rectificación o la supresión de los datos de su representado por el mismo canal, indicando la casilla de correo con la que se creó la cuenta.</li>
          <li><strong>Alumnos Invitados:</strong> Al no poseer un correo electrónico vinculado en nuestra base de datos que permita verificar de forma unívoca su identidad remotamente, el ejercicio de supresión de datos se realiza a través de su Docente administrador del aula, o bien mediante la eliminación de los datos locales del navegador (cookies).</li>
        </ul>
        <p>
          Para el ejercicio de estos derechos, o para cualquier duda o consulta sobre esta Política, puede contactarnos a: <br/>
          <strong>Correo electrónico:</strong> <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-primary hover:underline">{LEGAL_CONTACT_EMAIL}</a>
        </p>
        <p className="text-sm text-muted-foreground mt-4 border-l-4 border-muted pl-4">
          La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326,
          tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus 
          derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
        </p>
      </section>
    </div>
  )
}

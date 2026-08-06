import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | MaestrIA',
  description: 'Política de tratamiento de datos personales de MaestrIA, conforme a la Ley 25.326 de la República Argentina.',
}

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 prose prose-stone dark:prose-invert">
      <h1>Política de Privacidad y Tratamiento de Datos Personales</h1>
      <p className="text-muted-foreground">Última actualización: Agosto 2026</p>

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
        <p>La plataforma distingue dos tipos principales de usuarios, y en consecuencia, su tratamiento de datos:</p>
        
        <h3>2.1. Usuarios Registrados (Docentes)</h3>
        <p>
          Los docentes se registran mediante autenticación de terceros (OAuth de Google). Para la creación de su cuenta,
          recopilamos su <strong>nombre, apellido y dirección de correo electrónico</strong>. 
          <br/><strong>Finalidad:</strong> Administrar sus aulas, guardar la configuración pedagógica, emitir reportes
          de progreso de sus alumnos y gestionar la plataforma.
        </p>

        <h3>2.2. Alumnos Invitados (Guest Session) y Menores de Edad</h3>
        <p>
          MaestrIA opera bajo el principio de <strong>minimización de datos</strong> para los alumnos. 
          Los alumnos acceden a las aulas creadas por sus docentes mediante un código, operando como &quot;Invitados&quot;.
        </p>
        <ul>
          <li><strong>Datos recolectados:</strong> Nombre de pila o seudónimo proporcionado por el alumno, respuestas a los cuestionarios, interacciones con nuestra Inteligencia Artificial (dudas, consultas pedagógicas) y métricas de desempeño.</li>
          <li><strong>Datos excluidos:</strong> No solicitamos de forma obligatoria el correo electrónico, teléfono ni información personal sensible de los menores.</li>
          <li><strong>Mecanismo técnico:</strong> La sesión del invitado se mantiene activa temporalmente a través de una <em>cookie cifrada (firma HMAC)</em> en el navegador del usuario, asociando su actividad únicamente a su alias y al código del aula.</li>
        </ul>
        <p>
          <strong>Finalidad:</strong> Brindar feedback pedagógico automatizado, generar reportes de progreso para el docente y adaptar los cuestionarios según el desempeño.
        </p>
      </section>

      <section>
        <h2>3. Consentimiento y Responsabilidad de las Instituciones</h2>
        <p>
          El acceso a MaestrIA por parte de menores de edad (Alumnos) se realiza en el marco de una actividad educativa dirigida. 
          <strong>El Docente y/o la Institución Educativa</strong> que crea el aula virtual en MaestrIA e invita a sus alumnos, 
          asume la responsabilidad de haber recabado el consentimiento expreso, libre e informado de los padres, tutores o 
          representantes legales de los menores, de acuerdo con el Código Civil y Comercial de la Nación y la normativa de la AAIP.
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
          <li><strong>Docentes:</strong> Pueden ejercer sus derechos contactándonos a través de nuestro correo oficial.</li>
          <li><strong>Alumnos Invitados:</strong> Al no poseer un correo electrónico vinculado en nuestra base de datos que permita verificar de forma unívoca su identidad remotamente, el ejercicio de supresión de datos se realiza a través de su Docente administrador del aula, o bien mediante la eliminación de los datos locales del navegador (cookies).</li>
        </ul>
        <p>
          Para el ejercicio de estos derechos, o para cualquier duda o consulta sobre esta Política, puede contactarnos a: <br/>
          <strong>Correo electrónico:</strong> <a href="mailto:privacidad@maestria.com" className="text-primary hover:underline">privacidad@maestria.com</a>
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

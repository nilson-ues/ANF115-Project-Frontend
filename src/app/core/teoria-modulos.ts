import { Teoria } from '../shared/teoria';

// Teoría de los módulos de ingresos y gastos, Unidad I (notas y empresa), Unidad III y Unidad IV

export const TEORIA_INGRESOS_GASTOS: Teoria[] = [
  {
    titulo: 'Control de ingresos y gastos',
    formula: 'Ingresos totales = Σ ingresos del período\nGastos totales = Σ gastos del período\nResultado financiero = Ingresos totales − Gastos totales\n% de gastos = Gastos totales / Ingresos totales × 100 (si ingresos > 0)',
    texto: 'El control básico de una empresa parte de los totales del período seleccionado. El resultado financiero indica si los ingresos alcanzaron para cubrir los gastos; el porcentaje de gastos muestra cuántos centavos de cada dólar que ingresa se van en gastos. Un porcentaje mayor a 100 % significa que la empresa gastó más de lo que ingresó.',
    fuente: 'Guía del proyecto ANF115 2026, sección 7'
  },
  {
    titulo: 'Relación con el estado de resultados',
    formula: 'Resultado de los movimientos = Utilidad antes de impuesto y reserva',
    texto: 'Los movimientos históricos se cargaron desde los estados de resultados mensuales de la tesis: las ventas netas como ingreso y el costo de ventas, los gastos de administración, de venta, financieros y no deducibles como gastos. Por eso el resultado anual coincide con la utilidad antes de impuesto y reserva legal. El impuesto y la reserva no son movimientos: se calculan sobre esa utilidad. Cuando un gasto del mes quedó negativo (reversión contable), se registró como ingreso en "Reversiones y ajustes de gastos", porque el sistema solo acepta montos positivos.',
    fuente: 'Pérez Tejada et al. (2009), cuadros de estado de resultados 2008 y 2009'
  },
  {
    titulo: 'Integridad de los registros',
    formula: 'Monto > 0 · Categoría del mismo tipo que el movimiento · Anular en lugar de borrar',
    texto: 'Un movimiento nunca se borra: se anula indicando el motivo, y queda en la bitácora quién y cuándo lo hizo. Un período cerrado no acepta registros, cambios ni anulaciones; así se evita alterar cifras que ya se reportaron.',
    fuente: 'Guía del proyecto ANF115 2026, requerimientos no funcionales'
  }
];

export const TEORIA_PERIODOS: Teoria[] = [
  {
    titulo: 'Cierre de períodos',
    formula: 'Período cerrado ⇒ no se registran, modifican ni anulan movimientos',
    texto: 'El cierre mensual congela las cifras de un mes cuando ya se revisaron. Solo el administrador puede reabrir un período, y cada cierre o apertura queda en la bitácora. Los años 2008 y 2009 de la tesis están cerrados.',
    fuente: 'Control interno · Guía del proyecto ANF115 2026'
  }
];

export const TEORIA_EMPRESA: Teoria[] = [
  {
    titulo: 'Clasificación de las empresas por su tamaño (BMI)',
    formula: 'Microempresa: ventas hasta $68,571.43 · máximo 10 personas\nPequeña: desde $68,571.43 · 11 a 49 personas\nMediana: desde $685,714.28 hasta el límite de la gran empresa · 50 a 199 empleados\nGran empresa: más de $4,571,000.00 · más de 199 personas',
    texto: 'El Banco Multisectorial de Inversiones clasifica a las empresas por sus ventas anuales y su número de empleados. Por su actividad económica, DistriFarma es una empresa comercial (comercio al por mayor) del sector terciario.',
    fuente: 'ANF115 Unidad I, videoclase 10'
  },
  {
    titulo: 'Funciones del administrador financiero',
    formula: 'Objetivo básico financiero = maximizar el valor de la empresa',
    texto: 'El administrador financiero obtiene fondos y los aplica a los usos del negocio. Sus funciones principales en la cátedra son la planeación financiera (largo plazo: 2 a 5 años; corto plazo: hasta un año) y la administración de los activos fijos. Incrementar utilidades a corto plazo no es el objetivo si deteriora el valor a largo plazo.',
    fuente: 'ANF115 Unidad I, videoclase 12'
  }
];

export const TEORIA_NOTAS: Teoria[] = [
  {
    titulo: 'Notas a los estados financieros',
    formula: 'a. Declaración de cumplimiento de NIIF para las PYMES\nb. Resumen de políticas contables significativas\nc. Información de apoyo de cada partida, en el orden de los estados\nd. Otra información a revelar',
    texto: 'Según la Sección 8 de las NIIF para las PYMES, las notas son aclaraciones que amplían el origen y significado de las cifras: políticas contables, procedimientos, cálculos y transacciones. Forman parte integral de los estados financieros. Cada nota se identifica con un número y título, se presenta en secuencia lógica y siguiendo el orden de los rubros.',
    fuente: 'ANF115 Unidad I, videoclases 4 y 8'
  }
];

export const TEORIA_CAJA: Teoria[] = [
  {
    titulo: 'Presupuesto de caja (pronóstico de efectivo)',
    formula: 'Saldo final = Saldo inicial + Entradas (cobros) − Salidas\nFinanciamiento requerido = Saldo mínimo − Saldo final (si es positivo)\nExcedente = Saldo final − Saldo mínimo (si es positivo)',
    texto: 'Es el pronóstico, generalmente mensual, de las entradas y salidas de efectivo. Permite al director financiero determinar las necesidades futuras de efectivo, planear su financiamiento y controlar la liquidez. Los prestamistas siempre lo exigen, como el banco de la Guía práctica 1.',
    fuente: 'ANF115 Unidad III, videos 1 y 2'
  },
  {
    titulo: 'Método promedio',
    formula: 'Venta proyectada de cada mes = Σ ventas del año base / 12',
    texto: 'Supone que cada mes del año proyectado venderá el promedio mensual del año base. Es conservador: no supone crecimiento y suaviza la estacionalidad.',
    fuente: 'Guía práctica 1'
  },
  {
    titulo: 'Método de ratio de incremento',
    formula: 'Ratio = promedio de (Venta del mes / Venta del mes anterior − 1)\nVenta proyectada del mes = Venta del mismo mes del año base × (1 + Ratio)',
    texto: 'Supone que el ritmo promedio de crecimiento mensual observado se mantiene. Conserva la estacionalidad del año base, pero si las ventas son muy variables el ratio puede exagerar el crecimiento. El ratio se puede ajustar manualmente.',
    fuente: 'Guía práctica 1'
  },
  {
    titulo: 'Cobros de ventas a crédito',
    formula: 'Cobros del mes = Ventas del mes × % contado + Ventas del mes anterior × % cobrado al mes 1 + Ventas de hace dos meses × % cobrado al mes 2',
    texto: 'Las ventas al contado ingresan en el mismo mes; las ventas a crédito ingresan después, según los términos de crédito. Ejemplo de Pacific James: 10 % contado, 90 % del crédito al mes siguiente y 10 % a los dos meses.',
    fuente: 'ANF115 Unidad III, video 2'
  },
  {
    titulo: '¿Qué método presentar al banco?',
    formula: 'Comparar ventas totales, saldo final, meses con déficit y crecimiento implícito',
    texto: 'Al banco le interesa una proyección razonable y justificada. Si el ratio de incremento implica un crecimiento muy superior al histórico, conviene el método promedio por ser conservador; si el crecimiento es moderado y la empresa es estacional, el ratio describe mejor los meses de mayor necesidad de efectivo.',
    fuente: 'Guía práctica 1, inciso 7'
  }
];

export const TEORIA_PROYECTOS: Teoria[] = [
  {
    titulo: 'Periodo de recuperación (PR)',
    formula: 'Anualidad: PR = Inversión inicial / Entrada anual\nFlujo mixto: se suman las entradas hasta recuperar la inversión\nPR < máximo aceptable ⇒ se acepta',
    texto: 'Tiempo para recuperar la inversión inicial. Es sencillo e intuitivo, pero no considera explícitamente el valor del dinero en el tiempo y el máximo aceptable se define de forma subjetiva.',
    fuente: 'ANF115 Unidad III, video 5'
  },
  {
    titulo: 'Valor presente neto (VPN)',
    formula: 'VPN = Σ FEt / (1 + k)^t − FE0\nVPN > 0 se acepta · = 0 indiferente · < 0 se rechaza',
    texto: 'Descuenta los flujos al costo de capital (k), el rendimiento mínimo que exigen los inversionistas. Un VPN positivo aumenta la riqueza de los dueños en ese monto. Si hay inversiones durante la operación, se registran como flujos negativos.',
    fuente: 'ANF115 Unidad III, video 6'
  },
  {
    titulo: 'Tasa interna de rendimiento (TIR)',
    formula: '0 = Σ FEt / (1 + TIR)^t − FE0\nTIR > k se acepta · TIR < k se rechaza',
    texto: 'Es la tasa que hace el VPN igual a cero: el rendimiento que ganará la empresa si invierte en el proyecto. Pierde precisión cuando los flujos cambian de signo varias veces; no debe usarse sola.',
    fuente: 'ANF115 Unidad III, video 7'
  },
  {
    titulo: 'Valor económico agregado (EVA)',
    formula: 'EVA = Flujo de efectivo − (Costo de capital × Capital invertido)\nEVA a perpetuidad = EVA anual / Costo de capital',
    texto: 'Indica si el proyecto genera flujos por encima de lo que exigen los inversionistas (utilidad económica pura). Con flujos constantes a perpetuidad coincide con el VPN.',
    fuente: 'ANF115 Unidad III, video 6'
  },
  {
    titulo: 'Enfoques de decisión',
    formula: 'Aceptación–rechazo: ¿cumple el criterio mínimo?\nClasificación: ordenar por VPN de mayor a menor',
    texto: 'Con fondos ilimitados se aceptan todos los proyectos independientes que cumplan. Con racionamiento de capital o proyectos mutuamente excluyentes se usa la clasificación.',
    fuente: 'ANF115 Unidad III, video 5'
  }
];

export const TEORIA_EFECTIVO: Teoria[] = [
  {
    titulo: 'Ciclo operativo y ciclo de conversión del efectivo',
    formula: 'Ciclo operativo = EPI + PPC\nCCE = EPI + PPC − PPP\nEPI = 365 / Rotación de inventarios',
    texto: 'El ciclo de conversión del efectivo mide los días que el dinero queda invertido entre que se paga a los proveedores y se cobra a los clientes. Reducir la edad del inventario y el periodo de cobro, o alargar el periodo de pago sin dañar el crédito, libera efectivo.',
    fuente: 'ANF115 Unidad IV, tema 4 · Gitman'
  },
  {
    titulo: 'Efectivo mínimo para operaciones (método de razones)',
    formula: 'Rotación del efectivo = 365 / CCE\nEfectivo mínimo = Desembolsos totales anuales / Rotación del efectivo',
    texto: 'Estima el saldo de efectivo que la empresa necesita para operar. En el sistema, los desembolsos anuales son el costo de ventas más los gastos de operación y financieros del año (supuesto del sistema).',
    fuente: 'ANF115 Unidad IV, tema 4.6 · Gitman'
  },
  {
    titulo: 'Administración de ingresos y egresos',
    formula: 'Flotación · Aceleración de cobros · Postergación de pagos · Concentración del efectivo · Cuentas de saldo cero',
    texto: 'La flotación es el tiempo entre que se emite un pago y los fondos están disponibles. Para acelerar cobros se reducen los tiempos de envío, procesamiento y compensación; para postergar pagos se paga el último día del plazo sin perder descuentos. La concentración reúne el efectivo en una cuenta principal, y las cuentas de saldo cero solo reciben fondos cuando se presentan cheques.',
    fuente: 'ANF115 Unidad IV, tema 6'
  }
];

export const TEORIA_CREDITO: Teoria[] = [
  {
    titulo: 'Estándares, términos y supervisión del crédito',
    formula: 'Términos "neto 30": pago a 30 días de la factura\nPPC = Cuentas por cobrar / Ventas diarias',
    texto: 'Los estándares de crédito definen a qué clientes se les concede crédito; los términos fijan el plazo y los descuentos por pronto pago; la supervisión compara el periodo promedio de cobro con el plazo concedido y revisa la antigüedad de los saldos.',
    fuente: 'ANF115 Unidad IV, tema 5'
  },
  {
    titulo: 'Cambio en el periodo de crédito (Guía práctica 2)',
    formula: 'Rotación = Días del año / PPC\nRentabilidad adicional = Ventas adicionales × (1 − costo variable)\nInversión por ventas nuevas = (Ventas adicionales / Rotación nueva) × costo variable\nInversión por ventas originales = Ventas / Rotación nueva − Ventas / Rotación anterior\nRendimiento requerido = Inversión total × tasa requerida',
    texto: 'Conviene extender el plazo si la rentabilidad de las ventas adicionales supera el rendimiento requerido sobre la inversión adicional en cuentas por cobrar. Las cuentas por cobrar de las ventas nuevas se valoran al costo variable; las de las ventas originales, al valor completo, porque es dinero que antes se cobraba más rápido.',
    fuente: 'Guía práctica 2 · Van Horne'
  }
];

// src/lib/api/endpoints/consumo-repuesto.ts

// Interfaces
export interface OrdenMantenimiento {
    ordenId: number;
    motivo: string;
}

export interface Repuesto {
    repuestoId: number;
    nombre: string;
    cantidad: number;
}

export interface ConsumoRepuesto {
    consumoId?: number;
    cantidadConsumida: number; // Mapea a 'cantidad' en Java
    fechaConsumo: Date | null; // Mapea a 'fechaEntrada' en Java
    orden: OrdenMantenimiento | null;
    repuesto: Repuesto | null;
    fechaEntrada?: Date | null;
    fechaSalida?: Date | null;
}

// URLs base de las APIs (Mantenidas)
const API_CONSUMOS_URL = 'https://gestion-activos-backend-production.up.railway.app/api/consumos-repuesto';
const API_ORDENES_URL = 'https://gestion-activos-backend-production.up.railway.app/api/ordenes-mantenimiento';
const API_REPUESTOS_URL = 'https://gestion-activos-backend-production.up.railway.app/api/repuestos';

// ... (handleFetchError function)

const handleFetchError = async (response: Response, action: string = 'obtener'): Promise<string> => {
    const errorText = await response.text();
    let errorMessage = `Error al ${action} el consumo (HTTP ${response.status}). `;

    if (errorText) {
        errorMessage += `Detalle: ${errorText}`;
    } else {
        errorMessage += 'El servidor no devolvió un mensaje detallado.';
    }

    console.error(`Error de Fetch en ConsumoRepuesto/${action}:`, errorMessage);
    return errorMessage;
}

// ... (fetchConsumoInitialData function)

export const fetchConsumoInitialData = async (): Promise<{ consumos: ConsumoRepuesto[], ordenes: OrdenMantenimiento[], repuestos: Repuesto[] }> => {
    try {
        const [consumosResp, ordenesResp, repuestosResp] = await Promise.all([
            fetch(API_CONSUMOS_URL),
            fetch(API_ORDENES_URL),
            fetch(API_REPUESTOS_URL)
        ]);

        if (!consumosResp.ok || !ordenesResp.ok || !repuestosResp.ok) {
            const failingResp = !consumosResp.ok ? consumosResp : (!ordenesResp.ok ? ordenesResp : repuestosResp);
            throw new Error(await handleFetchError(failingResp, 'cargar datos iniciales'));
        }

        const [consumosData, ordenesData, repuestosData] = await Promise.all([
            consumosResp.json(),
            ordenesResp.json(),
            repuestosResp.json()
        ]);

        // 🚨 CAMBIO CLAVE: Mapeo explícito de los campos del backend al frontend
        const consumosFormateados: ConsumoRepuesto[] = consumosData.map((c: any) => ({
            consumoId: c.consumoId,
            cantidadConsumida: c.cantidad, // Mapea cantidad -> cantidadConsumida
            fechaConsumo: c.fechaEntrada ? new Date(c.fechaEntrada) : null, // Mapea fechaEntrada -> fechaConsumo
            
            // El mapeo que faltaba y causaba el problema inicial
            orden: c.ordenMantenimiento, // Mapea ordenMantenimiento -> orden
            repuesto: c.repuesto,
        }));

        return {
            consumos: consumosFormateados,
            ordenes: ordenesData as OrdenMantenimiento[],
            repuestos: repuestosData as Repuesto[]
        };

    } catch (error: any) {
        throw new Error(error.message || 'Error de conexión con el servidor (Spring Boot).');
    }
};


// *************** FUNCIONES CRUD DE MODIFICACIÓN ***************

/**
 * Guarda (crea o actualiza) un registro de consumo.
 */
export const saveConsumo = async (dataToSend: Partial<ConsumoRepuesto>): Promise<ConsumoRepuesto> => {
    const isEdit = !!dataToSend.consumoId;
    const url = isEdit ? `${API_CONSUMOS_URL}/${dataToSend.consumoId}` : API_CONSUMOS_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const payload = {
            repuesto: { repuestoId: dataToSend.repuesto?.repuestoId },
            ordenMantenimiento: { ordenId: dataToSend.orden?.ordenId },
            cantidad: dataToSend.cantidadConsumida,
            fechaEntrada: dataToSend.fechaConsumo instanceof Date ? dataToSend.fechaConsumo.toISOString() : dataToSend.fechaConsumo,
            fechaSalida: null,
            consumoId: dataToSend.consumoId
        };

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(await handleFetchError(response, isEdit ? 'actualizar' : 'crear'));
        }

        const savedData = await response.json();
        
        const result: ConsumoRepuesto = {
            consumoId: savedData.consumoId,
            cantidadConsumida: savedData.cantidad,
            fechaConsumo: savedData.fechaEntrada ? new Date(savedData.fechaEntrada) : null,
            orden: savedData.ordenMantenimiento,
            repuesto: savedData.repuesto,
        };

        return result;

    } catch (error: any) {
        throw new Error(error.message || `Error de conexión al intentar ${isEdit ? 'actualizar' : 'crear'} consumo.`);
    }
};

/**
 * Elimina un registro de consumo por su ID.
 */
export const deleteConsumo = async (consumoId: number): Promise<boolean> => {
    try {
        const response = await fetch(`${API_CONSUMOS_URL}/${consumoId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(await handleFetchError(response, 'eliminar'));
        }

        return true;
    } catch (error: any) {
        throw new Error(error.message || 'Error de conexión al intentar eliminar consumo.');
    }
};
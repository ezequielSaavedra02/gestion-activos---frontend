// src/lib/api/endpoints/ordenesMantenimiento.ts

// Interfaces
export interface Equipo {
    equipoId: number;
    nombre: string;
}

export interface OrdenMantenimiento {
    ordenId?: number;
    fecha: Date | null;
    motivo: string;
    descripcion: string;
    equipo: Equipo | null;
}

// URLs base de las APIs
const API_ORDENES_URL = 'https://gestion-activos-backend-production.up.railway.app/api/ordenes-mantenimiento';
const API_EQUIPOS_URL = 'https://gestion-activos-backend-production.up.railway.app/api/equipos';

/**
 * Función genérica para manejar errores de la respuesta HTTP de fetch.
 */
const handleFetchError = async (response: Response, action: string = 'obtener'): Promise<string> => {
    const errorText = await response.text();
    let errorMessage = `Error al ${action} la orden (HTTP ${response.status}). `;

    if (errorText) {
        errorMessage += `Detalle: ${errorText}`;
    } else {
        errorMessage += 'El servidor no devolvió un mensaje detallado.';
    }

    console.error(`Error de Fetch en Ordenes/${action}:`, errorMessage);
    return errorMessage;
}

// *************** Funciones CRUD de ÓRDENES DE MANTENIMIENTO ***************

/**
 * Obtiene todas las órdenes y los equipos en paralelo (para inicializar la vista).
 */
export const fetchInitialData = async (): Promise<{ ordenes: OrdenMantenimiento[], equipos: Equipo[] }> => {
    try {
        const [ordenesResponse, equiposResponse] = await Promise.all([
            fetch(API_ORDENES_URL),
            fetch(API_EQUIPOS_URL)
        ]);

        if (!ordenesResponse.ok || !equiposResponse.ok) {
            const errorMsg = (!ordenesResponse.ok ? 'Ordenes' : 'Equipos');
            throw new Error(await handleFetchError(ordenesResponse.ok ? equiposResponse : ordenesResponse, `cargar datos de ${errorMsg}`));
        }

        const [ordenesData, equiposData] = await Promise.all([
            ordenesResponse.json(),
            equiposResponse.json()
        ]);

        // Aseguramos que las fechas se pasen como objetos Date válidos
        const ordenesFormateadas = ordenesData.map((orden: any) => ({
            ...orden,
            fecha: orden.fecha ? new Date(orden.fecha) : null
        })) as OrdenMantenimiento[];

        return { ordenes: ordenesFormateadas, equipos: equiposData as Equipo[] };

    } catch (error: any) {
        throw new Error(error.message || 'Error de conexión con el servidor (Spring Boot).');
    }
};

/**
 * Guarda (crea o actualiza) una orden de mantenimiento.
 */
export const saveOrden = async (dataToSend: Partial<OrdenMantenimiento>): Promise<OrdenMantenimiento> => {
    const isEdit = !!dataToSend.ordenId;
    const url = isEdit ? `${API_ORDENES_URL}/${dataToSend.ordenId}` : API_ORDENES_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        // Preparamos el payload: Spring espera el ID del equipo y la fecha como ISO string
        const payload = {
            ...dataToSend,
            equipoId: dataToSend.equipo?.equipoId,
            fecha: dataToSend.fecha instanceof Date ? dataToSend.fecha.toISOString() : dataToSend.fecha
        };

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(await handleFetchError(response, isEdit ? 'actualizar' : 'crear'));
        }

        const savedData = await response.json();

        // Formateamos la fecha del objeto devuelto antes de retornarlo al componente
        return {
            ...savedData,
            fecha: savedData.fecha ? new Date(savedData.fecha) : null,
        } as OrdenMantenimiento;

    } catch (error: any) {
        throw new Error(error.message || `Error de conexión al intentar ${isEdit ? 'actualizar' : 'crear'} orden.`);
    }
};

/**
 * Elimina una orden de mantenimiento por su ID.
 */
export const deleteOrden = async (ordenId: number): Promise<boolean> => {
    try {
        const response = await fetch(`${API_ORDENES_URL}/${ordenId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(await handleFetchError(response, 'eliminar'));
        }

        return true;
    } catch (error: any) {
        throw new Error(error.message || 'Error de conexión al intentar eliminar orden.');
    }
};
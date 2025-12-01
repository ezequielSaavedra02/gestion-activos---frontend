// src/lib/api/endpoints/repuestos.ts

// Interfaz para la entidad Repuesto
export interface Repuesto {
    repuestoId?: number;
    nombre: string;
    tipo: string;
    cantidad: number;
}

// URL base de la API de repuestos
const API_BASE_URL = 'http://localhost:8080/api/repuestos';

/**
 * Función genérica para manejar errores de la respuesta HTTP de fetch.
 */
const handleFetchError = async (response: Response, action: string = 'obtener'): Promise<string> => {
    const errorText = await response.text();
    let errorMessage = `Error al ${action} el repuesto (HTTP ${response.status}). `;

    if (errorText) {
        errorMessage += `Detalle: ${errorText}`;
    } else {
        errorMessage += 'El servidor no devolvió un mensaje detallado.';
    }

    console.error("Error de Fetch en Repuestos:", errorMessage);
    return errorMessage;
}

// 1. Definición de las funciones CRUD con FETCH

/**
 * Obtiene la lista completa de repuestos. (GET /api/repuestos)
 */
export const getRepuestos = async (): Promise<Repuesto[]> => {
    try {
        const response = await fetch(API_BASE_URL);

        if (!response.ok) {
            throw new Error(await handleFetchError(response, 'cargar'));
        }

        return await response.json() as Repuesto[];
    } catch (error: any) {
        throw new Error(error.message || 'Error de conexión con el servidor (Spring Boot).');
    }
};

/**
 * Guarda un nuevo repuesto o actualiza uno existente. (POST o PUT /api/repuestos/{id})
 */
export const saveRepuesto = async (repuestoData: Partial<Repuesto>): Promise<Repuesto> => {
    const isEdit = !!repuestoData.repuestoId;
    const url = isEdit ? `${API_BASE_URL}/${repuestoData.repuestoId}` : API_BASE_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(repuestoData),
        });

        if (!response.ok) {
            throw new Error(await handleFetchError(response, isEdit ? 'actualizar' : 'crear'));
        }

        return await response.json() as Repuesto;
    } catch (error: any) {
        throw new Error(error.message || `Error de conexión al intentar ${isEdit ? 'actualizar' : 'crear'} repuesto.`);
    }
};

/**
 * Elimina un repuesto por su ID. (DELETE /api/repuestos/{id})
 */
export const deleteRepuesto = async (repuestoId: number): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/${repuestoId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(await handleFetchError(response, 'eliminar'));
        }

        return true;
    } catch (error: any) {
        throw new Error(error.message || 'Error de conexión al intentar eliminar repuesto.');
    }
};
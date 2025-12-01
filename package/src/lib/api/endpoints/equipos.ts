// Usamos fetch nativo, no necesitamos importar axios

// Interfaz para la entidad Equipo (Dispositivo)
export interface Equipo {
    equipoId?: number;
    marca: string;
    fechaIngreso: string;
    ubicacion: string;
    estado: string;
    numeroSerie: string;
    ip: string;
}

// URL base de la API de equipos
const API_BASE_URL = 'http://localhost:8080/api/equipos';

/**
 * Función genérica para manejar errores de la respuesta HTTP de fetch.
 */
const handleFetchError = async (response: Response, isEdit: boolean = false): Promise<string> => {
    // Intenta leer el cuerpo de la respuesta para obtener un mensaje detallado de Spring
    const errorText = await response.text();

    let baseMessage = isEdit ? 'actualizar' : 'crear/obtener';
    let errorMessage = `Error al ${baseMessage} el equipo (HTTP ${response.status}). `;

    // Adjuntamos el texto del error si existe
    if (errorText) {
        errorMessage += `Detalle: ${errorText}`;
    } else {
        errorMessage += 'El servidor no devolvió un mensaje detallado.';
    }

    console.error("Error de Fetch:", errorMessage);
    return errorMessage;
}

// Definición de las funciones CRUD con FETCH

/**
 * Obtiene la lista completa de equipos. (GET /api/equipos)
 */
export const getEquipos = async (): Promise<Equipo[]> => {
    try {
        const response = await fetch(API_BASE_URL);

        if (!response.ok) {
            throw new Error(await handleFetchError(response));
        }

        return await response.json() as Equipo[]; // Parsea el JSON
    } catch (error: any) {
        // Para errores de red puro (como el Network Error inicial)
        throw new Error(error.message || 'Error de conexión con el servidor (Spring Boot).');
    }
};

/**
 * Guarda un nuevo equipo o actualiza uno existente. (POST o PUT /api/equipos/{id})
 * @param equipoData - Los datos del equipo a guardar/actualizar.
 */
export const saveEquipo = async (equipoData: Partial<Equipo>): Promise<Equipo> => {
    const isEdit = !!equipoData.equipoId;
    const url = isEdit ? `${API_BASE_URL}/${equipoData.equipoId}` : API_BASE_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(equipoData),
        });

        if (!response.ok) {
            throw new Error(await handleFetchError(response, isEdit));
        }

        return await response.json() as Equipo;
    } catch (error: any) {
        throw new Error(error.message || `Error de conexión al intentar ${isEdit ? 'actualizar' : 'crear'} equipo.`);
    }
};

/**
 * Elimina un equipo por su ID. (DELETE /api/equipos/{id})
 * @param equipoId - El ID del equipo a eliminar.
 */
export const deleteEquipo = async (equipoId: number): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/${equipoId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(await handleFetchError(response));
        }

        // No hay JSON que leer, solo confirmamos éxito 200/204
        return true;
    } catch (error: any) {
        throw new Error(error.message || 'Error de conexión al intentar eliminar equipo.');
    }
};
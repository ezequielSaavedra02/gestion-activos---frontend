'use client';
import { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Box,
    IconButton,
    Button,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert
} from '@mui/material';

// Importaciones originales del usuario (Mantenidas)
import { IconRefresh, IconPlus, IconEdit, IconTrash, IconDeviceFloppy, IconX } from '@tabler/icons-react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

// IMPORTACIÓN DEL SERVICIO AXIOS
import { getEquipos, saveEquipo, deleteEquipo, Equipo } from '@/lib/api/endpoints/equipos';
// NOTA: Asegúrese de que el alias '@/services/equipos' esté configurado en su tsconfig.json.

// Next.js App Router requiere que el componente principal sea la exportación por defecto de la función
export default function ImpresorasPage() {
    // Estados para el listado
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para la búsqueda y filtro
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchField, setSearchField] = useState<string>('numeroSerie'); // Campo por defecto
    const [filteredEquipos, setFilteredEquipos] = useState<Equipo[]>([]);

    // Estados para el formulario
    const [formData, setFormData] = useState<Partial<Equipo> | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Estado para notificaciones
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });

    // Estado para el diálogo de confirmación de eliminación
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        equipoId: number | null;
    }>({
        open: false,
        equipoId: null
    });

    // Cierra la notificación
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Formatear fecha para mostrar solo la parte de la fecha
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    // Obtener lista de equipos - USA EL SERVICIO AXIOS
    const fetchEquipos = async () => {
        try {
            setLoading(true);
            setError(null);

            // LLAMADA AXIOS: Uso de la función getEquipos()
            const data: Equipo[] = await getEquipos();

            // Formatear fechas al cargar los datos
            const equiposFormateados = data.map((equipo: Equipo) => ({
                ...equipo,
                fechaIngreso: formatDate(equipo.fechaIngreso)
            }));
            setEquipos(equiposFormateados);
        } catch (err: any) {
            // Capturamos el mensaje de error lanzado por el servicio
            const errorMsg = err.message || 'Error al conectar con el servidor';
            setError(errorMsg);
            console.error('Error al cargar equipos:', err);
            setSnackbar({
                open: true,
                message: `Error al cargar los equipos: ${errorMsg}.`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchEquipos();
    }, []);

    // Efecto para filtrar los equipos cuando cambia el término de búsqueda, el campo o la lista de equipos
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = equipos.filter((item) => {
            const itemValue = (item as any)[searchField]?.toString().toLowerCase() || '';
            return itemValue.includes(lowercasedFilter);
        });
        setFilteredEquipos(filteredData);
    }, [searchTerm, searchField, equipos]);


    // Función para manejar el clic en el botón de eliminar
    const handleDeleteClick = (equipoId: number) => {
        setDeleteDialog({
            open: true,
            equipoId
        });
    };

    // Función para confirmar la eliminación - USA EL SERVICIO AXIOS
    const handleConfirmDelete = async () => {
        if (!deleteDialog.equipoId) return;

        try {
            // Reemplazo de fetch DELETE por el servicio
            await deleteEquipo(deleteDialog.equipoId);

            // Actualizar el estado eliminando el equipo
            setEquipos(equipos.filter(equipo => equipo.equipoId !== deleteDialog.equipoId));

            // Cerrar el diálogo
            setDeleteDialog({ open: false, equipoId: null });

            // Mostrar notificación de éxito
            setSnackbar({
                open: true,
                message: '✅ Equipo eliminado correctamente',
                severity: 'success'
            });
        } catch (err: any) {
            const errorMsg = err.message || 'Error al eliminar el equipo';
            console.error('Error al eliminar equipo:', err);
            setSnackbar({
                open: true,
                message: `❌ ${errorMsg}`,
                severity: 'error'
            });
        }
    };

    // Abrir formulario para editar o crear
    const handleOpenForm = (equipo?: Equipo) => {
        const today = new Date().toISOString().split('T')[0];
        setFormData(equipo || {
            marca: '',
            fechaIngreso: today,
            ubicacion: '',
            estado: 'Disponible',
            numeroSerie: '',
            ip: ''
        });
        setFormErrors({});
    };

    // Manejar cambios en el formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (formData && name) {
            setFormData({
                ...formData,
                [name]: value
            });
            // Limpiar error si existe
            if (formErrors[name]) {
                setFormErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
    };

    // Validar formulario
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData?.marca?.trim()) errors.marca = 'La marca es requerida';
        if (!formData?.fechaIngreso) errors.fechaIngreso = 'La fecha de ingreso es requerida';
        if (!formData?.ubicacion?.trim()) errors.ubicacion = 'La ubicación es requerida';
        if (!formData?.estado?.trim()) errors.estado = 'El estado es requerido';
        if (!formData?.numeroSerie?.trim()) errors.numeroSerie = 'El número de serie es requerido';
        if (!formData?.ip?.trim()) {
            errors.ip = 'La dirección IP es requerida';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Enviar formulario (crear o actualizar) - USA EL SERVICIO AXIOS
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData || !validateForm()) return;

        const isEdit = !!formData.equipoId;

        try {
            // Reemplazo de fetch POST/PUT por el servicio (el servicio maneja la lógica interna)
            const savedEquipo = await saveEquipo(formData);

            // Formatear la fecha del equipo guardado
            const equipoConFechaFormateada = {
                ...savedEquipo,
                fechaIngreso: formatDate(savedEquipo.fechaIngreso)
            };

            // Actualizar la lista de equipos
            if (isEdit) {
                setEquipos(equipos.map(eq =>
                    eq.equipoId === equipoConFechaFormateada.equipoId ? equipoConFechaFormateada : eq
                ));
                setSnackbar({
                    open: true,
                    message: '✅ Equipo actualizado correctamente',
                    severity: 'success'
                });
            } else {
                setEquipos([...equipos, equipoConFechaFormateada]);
                setSnackbar({
                    open: true,
                    message: '✅ Equipo creado correctamente',
                    severity: 'success'
                });
            }

            // Cerrar el formulario
            setFormData(null);
        } catch (err: any) {
            const errorMsg = err.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el equipo`;
            console.error(`Error al ${isEdit ? 'actualizar' : 'crear'} equipo:`, err);
            setSnackbar({
                open: true,
                message: `❌ ${errorMsg}`,
                severity: 'error'
            });
        }
    };

    return (
        <PageContainer title="Gestión de Equipos" description="Listado de equipos">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <DashboardCard
                        title="Listado de Equipos"
                        action={
                            <Box display="flex" gap={2} sx={{ '& .MuiButton-root': { minWidth: '140px' } }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<IconRefresh size={20} />}
                                    onClick={fetchEquipos}
                                    disabled={loading}
                                    size="large"
                                >
                                    Actualizar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<IconPlus size={20} />}
                                    onClick={() => handleOpenForm()}
                                    size="large"
                                >
                                    Nuevo Equipo
                                </Button>
                            </Box>
                        }
                    >
                        <Card>
                            <CardContent>
                                <Box display="flex" gap={2} mb={3}>
                                    <TextField
                                        select
                                        label="Filtrar por"
                                        value={searchField}
                                        onChange={(e) => setSearchField(e.target.value)}
                                        variant="outlined"
                                        sx={{ minWidth: 180 }}
                                    >
                                        <MenuItem value="numeroSerie">N° Serie</MenuItem>
                                        <MenuItem value="ip">IP</MenuItem>
                                        <MenuItem value="ubicacion">Ubicación</MenuItem>
                                        <MenuItem value="marca">Marca</MenuItem>
                                        <MenuItem value="estado">Estado</MenuItem>
                                    </TextField>
                                    <TextField
                                        label={`Buscar por ${searchField === 'numeroSerie' ? 'N° Serie' : searchField}`}
                                        variant="outlined"
                                        fullWidth
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </Box>
                                {loading ? (
                                    <Box display="flex" justifyContent="center" p={3}>
                                        <CircularProgress />
                                    </Box>
                                ) : error ? (
                                    <Typography color="error">{error}</Typography>
                                ) : (
                                    <TableContainer
                                        component={Paper}
                                        sx={{
                                            maxHeight: 'calc(100vh - 350px)',
                                            '& .MuiTableCell-root': {
                                                fontSize: '1rem',
                                                padding: '12px 16px'
                                            },
                                            '& .MuiTableHead-root': {
                                                backgroundColor: '#f5f5f5'
                                            }
                                        }}
                                    >
                                        <Table stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Marca</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>N° Serie</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>IP</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Ubicación</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>F. Ingreso</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredEquipos.length > 0 ? (
                                                    filteredEquipos.map((equipo) => (
                                                        <TableRow
                                                            key={equipo.equipoId}
                                                            hover
                                                            sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}
                                                        >
                                                            <TableCell>{equipo.equipoId}</TableCell>
                                                            <TableCell>{equipo.marca}</TableCell>
                                                            <TableCell>{equipo.numeroSerie}</TableCell>
                                                            <TableCell>{equipo.ip}</TableCell>
                                                            <TableCell>
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        p: '6px 16px',
                                                                        borderRadius: '16px',
                                                                        backgroundColor:
                                                                            equipo.estado === 'Disponible' ? 'success.main' :
                                                                                equipo.estado === 'En mantenimiento' ? 'warning.main' :
                                                                                    equipo.estado === 'Asignado' ? 'info.main' :
                                                                                        'grey.500',
                                                                        color: 'white',
                                                                        fontSize: '0.875rem',
                                                                        fontWeight: '500',
                                                                        display: 'inline-block',
                                                                        minWidth: '140px',
                                                                        textAlign: 'center'
                                                                    }}
                                                                >
                                                                    {equipo.estado}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>{equipo.ubicacion}</TableCell>
                                                            <TableCell>{equipo.fechaIngreso}</TableCell>
                                                            <TableCell>
                                                                <Box display="flex" gap={1}>
                                                                    <IconButton
                                                                        color="primary"
                                                                        onClick={() => handleOpenForm(equipo)}
                                                                        size="medium"
                                                                        title="Editar"
                                                                        sx={{
                                                                            '&:hover': {
                                                                                backgroundColor: 'primary.light',
                                                                                color: 'white'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <IconEdit size={20} />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        color="error"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteClick(equipo.equipoId!);
                                                                        }}
                                                                        size="medium"
                                                                        title="Eliminar"
                                                                        sx={{
                                                                            '&:hover': {
                                                                                backgroundColor: 'error.light',
                                                                                color: 'white'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <IconTrash size={20} />
                                                                    </IconButton>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center">
                                                            {searchTerm ? 'No se encontraron equipos con los filtros aplicados' : 'No hay equipos registrados'}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    </DashboardCard>
                </Grid>
            </Grid>

            {/* Formulario de edición/creación */}
            {formData && (
                <Dialog
                    open={!!formData}
                    onClose={() => setFormData(null)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {formData.equipoId ? 'Editar Equipo' : 'Nuevo Equipo'}
                    </DialogTitle>
                    <form onSubmit={handleSubmit}>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Marca *"
                                        name="marca"
                                        value={formData.marca || ''}
                                        onChange={handleInputChange}
                                        error={!!formErrors.marca}
                                        helperText={formErrors.marca}
                                        margin="normal"
                                        size="medium"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Número de Serie *"
                                        name="numeroSerie"
                                        value={formData.numeroSerie || ''}
                                        onChange={handleInputChange}
                                        error={!!formErrors.numeroSerie}
                                        helperText={formErrors.numeroSerie}
                                        margin="normal"
                                        size="medium"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Dirección IP *"
                                        name="ip"
                                        value={formData.ip || ''}
                                        onChange={handleInputChange}
                                        error={!!formErrors.ip}
                                        helperText={formErrors.ip}
                                        margin="normal"
                                        size="medium"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Estado *"
                                        name="estado"
                                        value={formData.estado || 'Disponible'}
                                        onChange={handleInputChange}
                                        error={!!formErrors.estado}
                                        helperText={formErrors.estado}
                                        margin="normal"
                                        size="medium"
                                        required
                                    >
                                        {['Disponible', 'En mantenimiento', 'Fuera de servicio', 'Asignado'].map((estado) => (
                                            <MenuItem key={estado} value={estado}>
                                                {estado}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Ubicación *"
                                        name="ubicacion"
                                        value={formData.ubicacion || ''}
                                        onChange={handleInputChange}
                                        error={!!formErrors.ubicacion}
                                        helperText={formErrors.ubicacion}
                                        margin="normal"
                                        size="medium"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Fecha de Ingreso *"
                                        name="fechaIngreso"
                                        type="date"
                                        value={formData.fechaIngreso || ''}
                                        onChange={handleInputChange}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        error={!!formErrors.fechaIngreso}
                                        helperText={formErrors.fechaIngreso}
                                        margin="normal"
                                        size="medium"
                                        required
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => setFormData(null)}
                                size="large"
                                startIcon={<IconX size={20} />}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<IconDeviceFloppy size={20} />}
                            >
                                {formData.equipoId ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            )}

            {/* Diálogo de confirmación de eliminación */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, equipoId: null })}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        ¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setDeleteDialog({ open: false, equipoId: null })}
                        size="large"
                        startIcon={<IconX size={20} />}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDelete}
                        size="large"
                        startIcon={<IconTrash size={20} />}
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notificación */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontSize: '1rem',
                        '& .MuiAlert-message': {
                            fontSize: '1rem'
                        }
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}
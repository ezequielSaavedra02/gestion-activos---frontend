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
import { IconRefresh, IconPlus, IconEdit, IconTrash, IconDeviceFloppy, IconX } from '@tabler/icons-react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

// IMPORTACIÓN DEL SERVICIO FETCH (Ajusta esta ruta de alias si es necesario)
import { getRepuestos, saveRepuesto, deleteRepuesto, Repuesto } from '@/lib/api/endpoints/repuestos';

// ELIMINADA: La Interfaz Repuesto (se importa del servicio)
// ELIMINADA: La URL base de la API (se usa en el servicio)

// Usamos export default function para Next.js App Router
export default function RepuestosPage() {
    // Estados para el listado
    const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para la búsqueda y filtro
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchField, setSearchField] = useState<string>('nombre'); // Campo por defecto
    const [filteredRepuestos, setFilteredRepuestos] = useState<Repuesto[]>([]);

    // Estados para el formulario
    const [formData, setFormData] = useState<Partial<Repuesto> | null>(null);
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
        repuestoId: number | null;
    }>({
        open: false,
        repuestoId: null
    });

    // Cierra la notificación
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Obtener lista de repuestos - USA EL SERVICIO
    const fetchRepuestos = async () => {
        try {
            setLoading(true);
            setError(null);

            // LLAMADA AL SERVICIO
            const data: Repuesto[] = await getRepuestos();
            setRepuestos(data);

        } catch (err: any) {
            const errorMsg = err.message || 'Error al conectar con el servidor';
            setError(errorMsg);
            console.error('Error al cargar repuestos:', err);
            setSnackbar({
                open: true,
                message: errorMsg,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchRepuestos();
    }, []);

    // Efecto para filtrar los repuestos cuando cambia el término de búsqueda, el campo o la lista de repuestos
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = repuestos.filter((item) => {
            const itemValue = (item as any)[searchField]?.toString().toLowerCase() || '';
            return itemValue.includes(lowercasedFilter);
        });
        setFilteredRepuestos(filteredData);
    }, [searchTerm, searchField, repuestos]);

    // Función para manejar el clic en el botón de eliminar
    const handleDeleteClick = (repuestoId: number) => {
        setDeleteDialog({
            open: true,
            repuestoId
        });
    };

    // Función para confirmar la eliminación - USA EL SERVICIO
    const handleConfirmDelete = async () => {
        if (!deleteDialog.repuestoId) return;

        try {
            // LLAMADA AL SERVICIO
            await deleteRepuesto(deleteDialog.repuestoId);

            // Actualizar el estado eliminando el repuesto
            setRepuestos(repuestos.filter(repuesto => repuesto.repuestoId !== deleteDialog.repuestoId));

            // Cerrar el diálogo
            setDeleteDialog({ open: false, repuestoId: null });

            // Mostrar notificación de éxito
            setSnackbar({
                open: true,
                message: '✅ Repuesto eliminado correctamente',
                severity: 'success'
            });
        } catch (err: any) {
            const errorMsg = err.message || 'Error al eliminar el repuesto';
            console.error('Error al eliminar repuesto:', err);
            setSnackbar({
                open: true,
                message: `❌ ${errorMsg}`,
                severity: 'error'
            });
        }
    };

    // Abrir formulario para editar o crear
    const handleOpenForm = (repuesto?: Repuesto) => {
        setFormData(repuesto || {
            nombre: '',
            tipo: 'Consumible',
            cantidad: 0
        });
        setFormErrors({});
    };

    // Manejar cambios en el formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (formData && name) {
            setFormData({
                ...formData,
                [name]: name === 'cantidad' ? parseInt(value) || 0 : value
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

        if (!formData?.nombre?.trim()) errors.nombre = 'El nombre es requerido';
        if (!formData?.tipo?.trim()) errors.tipo = 'El tipo es requerido';
        // Validación mejorada para cantidad
        if (formData?.cantidad === undefined || isNaN(formData.cantidad) || formData.cantidad < 0) {
            errors.cantidad = 'La cantidad debe ser un número positivo.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Enviar formulario (crear o actualizar) - USA EL SERVICIO
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData || !validateForm()) return;

        const isEdit = !!formData.repuestoId;

        try {
            // LLAMADA AL SERVICIO
            const savedRepuesto = await saveRepuesto(formData);

            // Actualizar la lista de repuestos
            if (isEdit) {
                setRepuestos(repuestos.map(rep =>
                    rep.repuestoId === savedRepuesto.repuestoId ? savedRepuesto : rep
                ));
                setSnackbar({
                    open: true,
                    message: '✅ Repuesto actualizado correctamente',
                    severity: 'success'
                });
            } else {
                setRepuestos([...repuestos, savedRepuesto]);
                setSnackbar({
                    open: true,
                    message: '✅ Repuesto creado correctamente',
                    severity: 'success'
                });
            }

            // Cerrar el formulario
            setFormData(null);
        } catch (err: any) {
            const errorMsg = err.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el repuesto`;
            console.error(`Error al ${isEdit ? 'actualizar' : 'crear'} repuesto:`, err);
            setSnackbar({
                open: true,
                message: `❌ ${errorMsg}`,
                severity: 'error'
            });
        }
    };

    // Opciones para el selector de tipo
    const tiposRepuesto = ['Consumible', 'Refacción', 'Herramienta', 'Insumo', 'Otro'];

    return (
        <PageContainer title="Gestión de Repuestos" description="Listado de repuestos">
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <DashboardCard
                        title="Listado de Repuestos"
                        action={
                            <Box display="flex" gap={2} sx={{ '& .MuiButton-root': {
                                    minWidth: '160px',
                                    height: '48px',
                                    fontSize: '1rem',
                                    textTransform: 'none',
                                    '& .MuiButton-startIcon': {
                                        marginRight: '8px'
                                    }
                                } }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<IconRefresh size={22} />}
                                    onClick={fetchRepuestos}
                                    disabled={loading}
                                    size="large"
                                >
                                    Actualizar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<IconPlus size={22} />}
                                    onClick={() => handleOpenForm()}
                                    size="large"
                                >
                                    Nuevo Repuesto
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
                                        <MenuItem value="nombre">Nombre</MenuItem>
                                        <MenuItem value="tipo">Tipo</MenuItem>
                                    </TextField>
                                    <TextField
                                        label={`Buscar por ${searchField}`}
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
                                                fontSize: '1.1rem',
                                                padding: '16px 24px',
                                                '&.MuiTableCell-head': {
                                                    fontWeight: 'bold',
                                                    backgroundColor: '#f5f5f5',
                                                    fontSize: '1.1rem',
                                                    padding: '16px 24px',
                                                    borderBottom: '2px solid #e0e0e0'
                                                }
                                            },
                                            '& .MuiTableRow-root': {
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.03)'
                                                }
                                            },
                                            '& .MuiTableHead-root': {
                                                backgroundColor: '#f5f5f5',
                                                '& th': {
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem',
                                                    padding: '16px 24px'
                                                }
                                            },
                                            '& .MuiTableCell-body': {
                                                '&:last-child': {
                                                    paddingRight: '24px'
                                                }
                                            }
                                        }}
                                    >
                                        <Table stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>ID</TableCell>
                                                    <TableCell>Nombre</TableCell>
                                                    <TableCell>Tipo</TableCell>
                                                    <TableCell>Cantidad</TableCell>
                                                    <TableCell>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredRepuestos.length > 0 ? (
                                                    filteredRepuestos.map((repuesto) => (
                                                        <TableRow
                                                            key={repuesto.repuestoId}
                                                            hover
                                                            sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}
                                                        >
                                                            <TableCell>{repuesto.repuestoId}</TableCell>
                                                            <TableCell>{repuesto.nombre}</TableCell>
                                                            <TableCell>
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        p: '8px 20px',
                                                                        borderRadius: '20px',
                                                                        backgroundColor:
                                                                            repuesto.cantidad > 10 ? 'success.main' :
                                                                                repuesto.cantidad > 0 ? 'warning.main' :
                                                                                    'error.main',
                                                                        color: 'white',
                                                                        fontSize: '1rem',
                                                                        fontWeight: '500',
                                                                        display: 'inline-block',
                                                                        minWidth: '120px',
                                                                        textAlign: 'center',
                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                                    }}
                                                                >
                                                                    {repuesto.tipo}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box
                                                                    component="span"
                                                                    sx={{
                                                                        p: '8px 16px',
                                                                        borderRadius: '20px',
                                                                        backgroundColor:
                                                                            repuesto.cantidad > 10 ? 'success.light' :
                                                                                repuesto.cantidad > 0 ? 'warning.light' :
                                                                                    'error.light',
                                                                        color: repuesto.cantidad > 0 ? 'text.primary' : 'white',
                                                                        fontWeight: 'bold',
                                                                        display: 'inline-block',
                                                                        minWidth: '50px',
                                                                        textAlign: 'center',
                                                                        fontSize: '1.1rem',
                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                                    }}
                                                                >
                                                                    {repuesto.cantidad}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box display="flex" gap={2}>
                                                                    <IconButton
                                                                        color="primary"
                                                                        onClick={() => handleOpenForm(repuesto)}
                                                                        size="large"
                                                                        title="Editar"
                                                                        sx={{
                                                                            '&:hover': {
                                                                                backgroundColor: 'primary.light',
                                                                                color: 'white',
                                                                                transform: 'scale(1.1)'
                                                                            },
                                                                            transition: 'transform 0.2s',
                                                                            p: '10px'
                                                                        }}
                                                                    >
                                                                        <IconEdit size={24} />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        color="error"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteClick(repuesto.repuestoId!);
                                                                        }}
                                                                        size="large"
                                                                        title="Eliminar"
                                                                        sx={{
                                                                            '&:hover': {
                                                                                backgroundColor: 'error.light',
                                                                                color: 'white',
                                                                                transform: 'scale(1.1)'
                                                                            },
                                                                            transition: 'transform 0.2s',
                                                                            p: '10px'
                                                                        }}
                                                                    >
                                                                        <IconTrash size={24} />
                                                                    </IconButton>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} align="center">
                                                            {searchTerm ? 'No se encontraron repuestos con los filtros aplicados' : 'No hay repuestos registrados'}
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
                        {formData.repuestoId ? 'Editar Repuesto' : 'Nuevo Repuesto'}
                    </DialogTitle>
                    <form onSubmit={handleSubmit}>
                        <DialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nombre *"
                                        name="nombre"
                                        value={formData.nombre || ''}
                                        onChange={handleInputChange}
                                        error={!!formErrors.nombre}
                                        helperText={formErrors.nombre}
                                        margin="normal"
                                        size="medium"
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Tipo *"
                                        name="tipo"
                                        value={formData.tipo || 'Consumible'}
                                        onChange={handleInputChange}
                                        error={!!formErrors.tipo}
                                        helperText={formErrors.tipo}
                                        margin="normal"
                                        size="medium"
                                        required
                                    >
                                        {tiposRepuesto.map((tipo) => (
                                            <MenuItem key={tipo} value={tipo}>
                                                {tipo}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Cantidad *"
                                        name="cantidad"
                                        type="number"
                                        value={formData.cantidad || 0}
                                        onChange={handleInputChange}
                                        error={!!formErrors.cantidad}
                                        helperText={formErrors.cantidad}
                                        margin="normal"
                                        size="medium"
                                        inputProps={{ min: 0 }}
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
                                {formData.repuestoId ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            )}

            {/* Diálogo de confirmación de eliminación */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, repuestoId: null })}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        ¿Estás seguro de que deseas eliminar este repuesto? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setDeleteDialog({ open: false, repuestoId: null })}
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
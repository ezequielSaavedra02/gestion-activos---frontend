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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    MenuItem,
    DialogContentText
} from '@mui/material';
import { IconRefresh, IconPlus, IconEdit, IconTrash, IconDeviceFloppy, IconX } from '@tabler/icons-react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

// Componentes de fecha
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// IMPORTACIÓN DEL SERVICIO FETCH
import {
    fetchInitialData,
    saveOrden,
    deleteOrden,
    Equipo,
    OrdenMantenimiento
} from '@/lib/api/endpoints/ordenesMantenimiento';


// Usamos export default function para Next.js App Router
export default function OrdenesMantenimientoPage() {
    // States for listing
    const [ordenes, setOrdenes] = useState<OrdenMantenimiento[]>([]);
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para la búsqueda y filtro
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchField, setSearchField] = useState<string>('motivo'); // Campo por defecto
    const [filteredOrdenes, setFilteredOrdenes] = useState<OrdenMantenimiento[]>([]);

    // States for the form
    const [formData, setFormData] = useState<Partial<OrdenMantenimiento> | null>(null); // Inicializado a null
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // State for notifications
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });

    // State for delete confirmation dialog
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        ordenId: number | null;
    }>({
        open: false,
        ordenId: null
    });

    // Cierra la notificación
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Fetch maintenance orders and equipment - USA EL SERVICIO
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const { ordenes: ordenesData, equipos: equiposData } = await fetchInitialData();

            setOrdenes(ordenesData);
            setEquipos(equiposData);

        } catch (err: any) {
            const errorMsg = err.message || 'Error al conectar con el servidor';
            setError(errorMsg);
            console.error('Error al cargar datos:', err);
            setSnackbar({
                open: true,
                message: errorMsg,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Load data when component mounts
    useEffect(() => {
        fetchData();
    }, []);

    // Efecto para filtrar las órdenes cuando cambia el término de búsqueda, el campo o la lista de órdenes
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = ordenes.filter((item) => {
            let itemValue = '';
            if (searchField === 'equipo') {
                itemValue = item.equipo ? `ID: ${item.equipo.equipoId} - ${item.equipo.marca}`.toLowerCase() : '';
            } else {
                itemValue = (item as any)[searchField]?.toString().toLowerCase() || '';
            }
            return itemValue.includes(lowercasedFilter);
        });
        setFilteredOrdenes(filteredData);
    }, [searchTerm, searchField, ordenes]);

    // Handle delete button click
    const handleDeleteClick = (ordenId: number) => {
        setDeleteDialog({
            open: true,
            ordenId
        });
    };

    // Confirm delete action - USA EL SERVICIO
    const handleConfirmDelete = async () => {
        if (!deleteDialog.ordenId) return;

        try {
            await deleteOrden(deleteDialog.ordenId);

            setOrdenes(ordenes.filter(orden => orden.ordenId !== deleteDialog.ordenId));

            setDeleteDialog({ open: false, ordenId: null });

            setSnackbar({
                open: true,
                message: '✅ Orden de mantenimiento eliminada correctamente',
                severity: 'success'
            });
        } catch (err: any) {
            const errorMsg = err.message || 'Error al eliminar la orden de mantenimiento';
            console.error('Error al eliminar orden de mantenimiento:', err);
            setSnackbar({
                open: true,
                message: `❌ ${errorMsg}`,
                severity: 'error'
            });
        }
    };

    // Open form for editing or creating
    const handleOpenForm = (orden?: OrdenMantenimiento) => {
        setFormData({
            ordenId: orden?.ordenId,
            fecha: orden?.fecha || new Date(),
            motivo: orden?.motivo || '',
            descripcion: orden?.descripcion || '',
            equipo: orden?.equipo || null
        });
        setFormErrors({});
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (formData) {
            setFormData({
                ...formData,
                [name]: value
            });
            if (formErrors[name]) {
                setFormErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
    };

    // Handle date change
    const handleDateChange = (date: Date | null) => {
        if (formData) {
            setFormData({
                ...formData,
                fecha: date
            });
            if (formErrors.fecha) {
                setFormErrors(prev => ({
                    ...prev,
                    fecha: ''
                }));
            }
        }
    };

    // Handle equipment change
    const handleEquipoChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const equipoId = parseInt(event.target.value as string);
        const selectedEquipo = equipos.find(e => e.equipoId === equipoId) || null;

        if (formData) {
            setFormData({
                ...formData,
                equipo: selectedEquipo
            });
            if (formErrors.equipo) {
                setFormErrors(prev => ({
                    ...prev,
                    equipo: ''
                }));
            }
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData?.fecha) errors.fecha = 'La fecha es requerida';
        if (!formData?.motivo?.trim()) errors.motivo = 'El motivo es requerido';
        if (!formData?.equipo) errors.equipo = 'Debe seleccionar un equipo';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Format date for display
    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Submit form (create or update) - USA EL SERVICIO
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData || !validateForm()) return;

        const isEdit = !!formData.ordenId;

        try {
            const savedOrden = await saveOrden(formData);

            if (isEdit) {
                setOrdenes(ordenes.map(orden =>
                    orden.ordenId === savedOrden.ordenId ? savedOrden : orden
                ));
                setSnackbar({
                    open: true,
                    message: '✅ Orden de mantenimiento actualizada correctamente',
                    severity: 'success'
                });
            } else {
                setOrdenes([...ordenes, savedOrden]);
                setSnackbar({
                    open: true,
                    message: '✅ Orden de mantenimiento creada correctamente',
                    severity: 'success'
                });
            }

            setFormData(null);
        } catch (err: any) {
            const errorMsg = err.message || `Error al ${isEdit ? 'actualizar' : 'crear'} la orden de mantenimiento`;
            console.error(`Error al ${isEdit ? 'actualizar' : 'crear'} orden de mantenimiento:`, err);
            setSnackbar({
                open: true,
                message: `❌ ${errorMsg}`,
                severity: 'error'
            });
        }
    };


    return (
        <PageContainer title="Gestión de Órdenes de Mantenimiento" description="Listado de órdenes de mantenimiento">
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <DashboardCard
                            title="Listado de Órdenes de Mantenimiento"
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
                                        onClick={fetchData}
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
                                        Nueva Orden
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
                                            <MenuItem value="motivo">Motivo</MenuItem>
                                            <MenuItem value="descripcion">Descripción</MenuItem>
                                            <MenuItem value="equipo">Equipo</MenuItem>
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
                                                    fontSize: '1rem',
                                                    padding: '12px 16px',
                                                    '&.MuiTableCell-head': {
                                                        fontWeight: 'bold',
                                                        backgroundColor: '#f5f5f5',
                                                        fontSize: '1rem',
                                                        padding: '12px 16px',
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
                                                        fontSize: '1rem',
                                                        padding: '12px 16px'
                                                    }
                                                },
                                                '& .MuiTableCell-body': {
                                                    '&:last-child': {
                                                        paddingRight: '16px'
                                                    }
                                                }
                                            }}
                                        >
                                            <Table stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>ID</TableCell>
                                                        <TableCell>Fecha</TableCell>
                                                        <TableCell>Motivo</TableCell>
                                                        <TableCell>Descripción</TableCell>
                                                        <TableCell>Equipo</TableCell>
                                                        <TableCell>Acciones</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredOrdenes.length > 0 ? (
                                                        filteredOrdenes.map((orden) => (
                                                            <TableRow
                                                                key={orden.ordenId}
                                                                hover
                                                                sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}
                                                            >
                                                                <TableCell>{orden.ordenId}</TableCell>
                                                                <TableCell>{formatDate(orden.fecha)}</TableCell>
                                                                <TableCell>{orden.motivo}</TableCell>
                                                                <TableCell>{
                                                                    orden.descripcion?.length > 50
                                                                        ? `${orden.descripcion.substring(0, 50)}...`
                                                                        : orden.descripcion || '-'}
                                                                </TableCell>
                                                                {/* 🚨 CORRECCIÓN: Muestra ID y MARCA */}
                                                                <TableCell>
                                                                    {orden.equipo
                                                                        ? `ID: ${orden.equipo.equipoId} - ${orden.equipo.marca}`
                                                                        : '-'
                                                                    }
                                                                </TableCell>
                                                                {/* 🚨 FIN CORRECCIÓN */}
                                                                <TableCell>
                                                                    <Box display="flex" gap={1}>
                                                                        <IconButton
                                                                            color="primary"
                                                                            onClick={() => handleOpenForm(orden)}
                                                                            size="small"
                                                                        >
                                                                            <IconEdit size={20} />
                                                                        </IconButton>
                                                                        <IconButton
                                                                            color="error"
                                                                            onClick={() => orden.ordenId && handleDeleteClick(orden.ordenId)}
                                                                            size="small"
                                                                        >
                                                                            <IconTrash size={20} />
                                                                        </IconButton>
                                                                    </Box>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={6} align="center">
                                                                {searchTerm ? 'No se encontraron órdenes con los filtros aplicados' : 'No hay órdenes de mantenimiento registradas'}
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

                {/* Delete confirmation dialog */}
                <Dialog
                    open={deleteDialog.open}
                    onClose={() => setDeleteDialog({ open: false, ordenId: null })}
                >
                    <DialogTitle>Confirmar eliminación</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            ¿Está seguro de que desea eliminar esta orden de mantenimiento? Esta acción no se puede deshacer.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setDeleteDialog({ open: false, ordenId: null })}
                            color="primary"
                            startIcon={<IconX size={20} />}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            color="error"
                            variant="contained"
                            startIcon={<IconTrash size={20} />}
                        >
                            Eliminar
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Maintenance order form */}
                <Dialog
                    open={!!formData}
                    onClose={() => setFormData(null)}
                    maxWidth="md"
                    fullWidth
                >
                    <form onSubmit={handleSubmit}>
                        <DialogTitle>
                            {formData?.ordenId ? 'Editar Orden de Mantenimiento' : 'Nueva Orden de Mantenimiento'}
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <DatePicker
                                        label="Fecha"
                                        value={formData?.fecha ?? null}
                                        onChange={handleDateChange}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                margin: 'normal',
                                                error: !!formErrors.fecha,
                                                helperText: formErrors.fecha || ' ',
                                                required: true
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Motivo"
                                        name="motivo"
                                        value={formData?.motivo || ''}
                                        onChange={handleInputChange}
                                        error={!!formErrors.motivo}
                                        helperText={formErrors.motivo || ' '}
                                        required
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Descripción"
                                        name="descripcion"
                                        value={formData?.descripcion || ''}
                                        onChange={handleInputChange}
                                        multiline
                                        rows={4}
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Equipo"
                                        name="equipo"
                                        value={formData?.equipo?.equipoId?.toString() || ''}
                                        onChange={handleEquipoChange as any}
                                        error={!!formErrors.equipo}
                                        helperText={formErrors.equipo || ' '}
                                        required
                                        margin="normal"
                                        // CORRECCIÓN DE ESTILO APLICADA AQUÍ:
                                        SelectProps={{
                                            MenuProps: {
                                                PaperProps: {
                                                    sx: {
                                                        maxHeight: 300,
                                                        minWidth: 250,
                                                    },
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>Seleccione un equipo</em>
                                        </MenuItem>
                                        {equipos.map((equipo) => (
                                            <MenuItem key={equipo.equipoId} value={equipo.equipoId}>
                                                {/* 🚨 CORRECCIÓN: Usamos la propiedad MARCA */}
                                                {`ID: ${equipo.equipoId} - ${equipo.marca}`}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={() => setFormData(null)}
                                startIcon={<IconX size={20} />}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                startIcon={<IconDeviceFloppy size={20} />}
                            >
                                {formData?.ordenId ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Notification */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </LocalizationProvider>
        </PageContainer>
    );
}
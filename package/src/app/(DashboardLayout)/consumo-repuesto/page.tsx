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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// IMPORTACIÓN DEL SERVICIO FETCH
import {
    fetchConsumoInitialData,
    saveConsumo,
    deleteConsumo,
    ConsumoRepuesto,
    OrdenMantenimiento,
    Repuesto
} from '@/lib/api/endpoints/consumo-repuesto';


export default function ConsumoRepuestoPage() {
    // States for listing
    const [consumos, setConsumos] = useState<ConsumoRepuesto[]>([]);
    const [ordenes, setOrdenes] = useState<OrdenMantenimiento[]>([]);
    const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para la búsqueda y filtro
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchField, setSearchField] = useState<string>('repuesto'); // Campo por defecto
    const [filteredConsumos, setFilteredConsumos] = useState<ConsumoRepuesto[]>([]);

    // States for the form
    const [formData, setFormData] = useState<Partial<ConsumoRepuesto> | null>(null);
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
        consumoId: number | null;
    }>({
        open: false,
        consumoId: null
    });

    // Cierra la notificación
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Fetch initial data - USA EL SERVICIO
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const { consumos: consumosData, ordenes: ordenesData, repuestos: repuestosData } = await fetchConsumoInitialData();

            setConsumos(consumosData);
            setOrdenes(ordenesData);
            setRepuestos(repuestosData);

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

    // Efecto para filtrar los consumos cuando cambia el término de búsqueda, el campo o la lista de consumos
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = consumos.filter((item) => {
            let itemValue = '';
            if (searchField === 'repuesto') {
                itemValue = item.repuesto ? `${item.repuesto.nombre} (Stock: ${item.repuesto.cantidad})`.toLowerCase() : '';
            } else if (searchField === 'orden') {
                itemValue = item.orden ? `ID: ${item.orden.ordenId} - Motivo: ${item.orden.motivo}`.toLowerCase() : '';
            } else {
                itemValue = (item as any)[searchField]?.toString().toLowerCase() || '';
            }
            return itemValue.includes(lowercasedFilter);
        });
        setFilteredConsumos(filteredData);
    }, [searchTerm, searchField, consumos]);

    // Handle delete button click
    const handleDeleteClick = (consumoId: number) => {
        setDeleteDialog({
            open: true,
            consumoId
        });
    };

    // Confirm delete action - USA EL SERVICIO
    const handleConfirmDelete = async () => {
        if (!deleteDialog.consumoId) return;

        try {
            await deleteConsumo(deleteDialog.consumoId);

            setConsumos(consumos.filter(c => c.consumoId !== deleteDialog.consumoId));

            setDeleteDialog({ open: false, consumoId: null });

            setSnackbar({
                open: true,
                message: '✅ Consumo eliminado correctamente',
                severity: 'success'
            });
            // Re-fetch para actualizar el stock del repuesto en la tabla
            fetchData();
        } catch (err: any) {
            const errorMsg = err.message || 'Error al eliminar el consumo';
            console.error('Error al eliminar consumo:', err);
            setSnackbar({
                open: true,
                message: `❌ ${errorMsg}`,
                severity: 'error'
            });
        }
    };

    // Open form for editing or creating
    const handleOpenForm = (consumo?: ConsumoRepuesto) => {
        setFormData({
            consumoId: consumo?.consumoId,
            fechaConsumo: consumo?.fechaConsumo || new Date(),
            cantidadConsumida: consumo?.cantidadConsumida || 1,
            orden: consumo?.orden || null,
            repuesto: consumo?.repuesto || null
        });
        setFormErrors({});
    };

    // Handle input changes (mantiene la cantidad como número)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (formData) {
            setFormData({
                ...formData,
                [name]: name === 'cantidadConsumida' ? parseInt(value) || 0 : value
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
                fechaConsumo: date
            });
            if (formErrors.fechaConsumo) {
                setFormErrors(prev => ({
                    ...prev,
                    fechaConsumo: ''
                }));
            }
        }
    };

    // Handle entity change (Repuesto or Orden)
    const handleEntityChange = (name: 'orden' | 'repuesto', valueId: number) => {
        if (formData) {
            let selectedEntity: Repuesto | OrdenMantenimiento | null = null;

            if (name === 'orden') {
                selectedEntity = ordenes.find(o => o.ordenId === valueId) || null;
            } else if (name === 'repuesto') {
                selectedEntity = repuestos.find(r => r.repuestoId === valueId) || null;
            }

            setFormData(prev => ({
                ...prev,
                [name]: selectedEntity
            }));

            if (formErrors[name]) {
                setFormErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData?.fechaConsumo) errors.fechaConsumo = 'La fecha es requerida';
        if (!formData?.repuesto) errors.repuesto = 'Debe seleccionar un repuesto';
0
        // Validation for 'orden'
        if (!formData?.orden) {
            errors.orden = 'Debe seleccionar una orden de mantenimiento';
        } else {
            const isAlreadyUsed = consumos.some(
                c => c.orden?.ordenId === formData.orden?.ordenId && c.consumoId !== formData.consumoId
            );
            if (isAlreadyUsed) {
                errors.orden = 'Esta orden de mantenimiento ya ha sido utilizada en otro consumo.';
            }
        }

        if (formData?.cantidadConsumida === undefined || formData.cantidadConsumida <= 0) {
            errors.cantidadConsumida = 'La cantidad debe ser mayor a cero.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Format date for display
    const formatDate = (date: Date | null): string => {
        if (!date) return '-';
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

        const isEdit = !!formData.consumoId;

        try {
            const savedConsumo = await saveConsumo(formData);

            // 🚨 CORRECCIÓN CLAVE DE FUSIÓN: Usamos == para evitar fallos de tipo (number vs string)
            const savedOrdenId = savedConsumo.orden?.ordenId;
            const savedRepuestoId = savedConsumo.repuesto?.repuestoId;

            // Busca el objeto completo en el estado local usando el ID devuelto
            const fullOrden = ordenes.find(o => o.ordenId == savedOrdenId) || null;
            const fullRepuesto = repuestos.find(r => r.repuestoId == savedRepuestoId) || null;

            const finalConsumo: ConsumoRepuesto = {
                ...savedConsumo,
                orden: fullOrden, // Fusiona el objeto con el Motivo
                repuesto: fullRepuesto, // Fusiona el objeto con el Nombre/Stock
                cantidadConsumida: savedConsumo.cantidadConsumida // Usa el valor mapeado y correcto
            };

            if (isEdit) {
                setConsumos(consumos.map(c =>
                    c.consumoId === finalConsumo.consumoId ? finalConsumo : c
                ));
                setSnackbar({
                    open: true,
                    message: '✅ Consumo actualizado correctamente',
                    severity: 'success'
                });
            } else {
                setConsumos([...consumos, finalConsumo]);
                setSnackbar({
                    open: true,
                    message: '✅ Consumo creado correctamente',
                    severity: 'success'
                });
            }

            setFormData(null);
            // 🚨 Re-fetch para actualizar el stock del repuesto en la lista general
            fetchData();
        } catch (err: any) {
            const errorMsg = err.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el consumo`;
            console.error(`Error al ${isEdit ? 'actualizar' : 'crear'} consumo:`, err);
            setSnackbar({
                open: true,
                message: `❌ ${errorMsg}`,
                severity: 'error'
            });
        }
    };


    return (
        <PageContainer title="Gestión de Consumo de Repuestos" description="Registro de materiales utilizados en mantenimiento">
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <DashboardCard
                            title="Listado de Consumos de Repuesto"
                            action={
                                <Box display="flex" gap={2} sx={{ '& .MuiButton-root': { minWidth: '160px' } }}>
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
                                        Nuevo Consumo
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
                                            <MenuItem value="repuesto">Repuesto</MenuItem>
                                            <MenuItem value="orden">Orden</MenuItem>
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
                                            sx={{ maxHeight: 'calc(100vh - 350px)', fontSize: '1rem' }}
                                        >
                                            <Table stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>ID</TableCell>
                                                        <TableCell>Fecha Consumo</TableCell>
                                                        <TableCell>Repuesto</TableCell>
                                                        <TableCell>Cantidad Usada</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Motivo Orden</TableCell>
                                                        <TableCell>Acciones</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredConsumos.length > 0 ? (
                                                        filteredConsumos.map((consumo) => (
                                                            <TableRow key={consumo.consumoId} hover>
                                                                <TableCell>{consumo.consumoId}</TableCell>
                                                                <TableCell>{formatDate(consumo.fechaConsumo)}</TableCell>
                                                                <TableCell>
                                                                    {consumo.repuesto ? `${consumo.repuesto.nombre} (Stock: ${consumo.repuesto.cantidad})` : '-'}
                                                                </TableCell>
                                                                <TableCell>{consumo.cantidadConsumida}</TableCell>
                                                                <TableCell>
                                                                    {consumo.orden ? `ID: ${consumo.orden.ordenId} - Motivo: ${consumo.orden.motivo}` : '-'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Box display="flex" gap={1}>
                                                                        <IconButton color="primary" onClick={() => handleOpenForm(consumo)} size="small">
                                                                            <IconEdit size={20} />
                                                                        </IconButton>
                                                                        <IconButton color="error" onClick={() => consumo.consumoId && handleDeleteClick(consumo.consumoId)} size="small">
                                                                            <IconTrash size={20} />
                                                                        </IconButton>
                                                                    </Box>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={6} align="center">
                                                                {searchTerm ? 'No se encontraron consumos con los filtros aplicados' : 'No hay registros de consumo'}
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
                <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, consumoId: null })}>
                    <DialogTitle>Confirmar eliminación</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            ¿Está seguro de que desea eliminar este registro de consumo? Esta acción no se puede deshacer.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialog({ open: false, consumoId: null })} color="primary" startIcon={<IconX size={20} />}>
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmDelete} color="error" variant="contained" startIcon={<IconTrash size={20} />}>
                            Eliminar
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Consumo form */}
                <Dialog open={!!formData} onClose={() => setFormData(null)} maxWidth="sm" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle>{formData?.consumoId ? 'Editar Consumo de Repuesto' : 'Nuevo Consumo de Repuesto'}</DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <DatePicker
                                        label="Fecha de Consumo"
                                        value={formData?.fechaConsumo ?? null}
                                        onChange={handleDateChange}
                                        format="dd/MM/yyyy"
                                        slotProps={{
                                            textField: { fullWidth: true, margin: 'normal', error: !!formErrors.fechaConsumo, helperText: formErrors.fechaConsumo || ' ', required: true }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Cantidad Consumida *"
                                        name="cantidadConsumida"
                                        type="number"
                                        value={formData?.cantidadConsumida || 0}
                                        onChange={handleInputChange}
                                        error={!!formErrors.cantidadConsumida}
                                        helperText={formErrors.cantidadConsumida || ' '}
                                        required
                                        margin="normal"
                                        inputProps={{ min: 1 }}
                                    />
                                </Grid>

                                {/* Selector de Repuesto */}
                                <Grid item xs={12}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Repuesto Utilizado *"
                                        name="repuesto"
                                        value={formData?.repuesto?.repuestoId?.toString() || ''}
                                        onChange={(e) => handleEntityChange('repuesto', parseInt(e.target.value))}
                                        error={!!formErrors.repuesto}
                                        helperText={formErrors.repuesto || ' '}
                                        required
                                        margin="normal"
                                        SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300, minWidth: 250, }, }, }, }}
                                    >
                                        <MenuItem value=""><em>Seleccione un repuesto</em></MenuItem>
                                        {repuestos.map((rep) => (
                                            <MenuItem key={rep.repuestoId} value={rep.repuestoId}>
                                                {`${rep.nombre} (Stock: ${rep.cantidad})`}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {/* Selector de Orden de Mantenimiento */}
                                <Grid item xs={12}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Motivo de la Orden *"
                                        name="orden"
                                        value={formData?.orden?.ordenId?.toString() || ''}
                                        onChange={(e) => handleEntityChange('orden', parseInt(e.target.value))}
                                        error={!!formErrors.orden}
                                        helperText={formErrors.orden || ' '}
                                        required
                                        margin="normal"
                                        SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300, minWidth: 250, }, }, }, }}
                                    >
                                        <MenuItem value=""><em>Seleccione una orden</em></MenuItem>
                                        {ordenes.map((ord) => {
                                            const isUsed = consumos.some(c => c.orden?.ordenId === ord.ordenId && c.consumoId !== formData?.consumoId);
                                            return (
                                                <MenuItem key={ord.ordenId} value={ord.ordenId} disabled={isUsed}>
                                                    {`ID: ${ord.ordenId} - Motivo: ${ord.motivo}`} {isUsed && '(Ya en uso)'}
                                                </MenuItem>
                                            );
                                        })}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setFormData(null)} startIcon={<IconX size={20} />}>Cancelar</Button>
                            <Button type="submit" variant="contained" color="primary" startIcon={<IconDeviceFloppy size={20} />}>
                                {formData?.consumoId ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Notification */}
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </LocalizationProvider>
        </PageContainer>
    );
};
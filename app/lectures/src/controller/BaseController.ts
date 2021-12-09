import Controller from "sap/ui/core/mvc/Controller";
import Formatter from "lectures/model/formatter";
import MessageToast from "sap/m/MessageToast";
import Event from "sap/ui/base/Event";
import CalendarAppointment from "sap/ui/unified/CalendarAppointment";
import Popover from "sap/m/Popover";
import V4Context from "sap/ui/model/odata/v4/Context";
import Dialog from "sap/m/Dialog";
import Input from "sap/m/Input";
import DateTimeOffset from "sap/ui/model/odata/type/DateTimeOffset";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import DateTimePicker from "sap/m/DateTimePicker";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ComboBox from "sap/m/ComboBox";
import { ValueState } from "sap/ui/core/library";

/**
 * @namespace lectures.controller
 */
export default class BaseController extends Controller {
    public formatter: Formatter = new Formatter();
    public resourceBundle: ResourceBundle;
    private appointmentPopover: Popover;
    private lectureFormDialog: Dialog;
    private alldayFormDialog: Dialog;

    public async onInit(): Promise<void> {
        this.resourceBundle = await this.getResourceBundle();
    }

    public async handleSelectLecture(event: Event): Promise<void> {
        const appointment = event.getParameter("appointment") as CalendarAppointment;
        if (appointment)
            await this.showDetailsPopover(appointment);
    }

    public async handleEditButton(): Promise<void> {
        const popover = this.getView().byId("detailsPopover") as Popover;
        popover.close();

        const lectureContext = popover.getBindingContext() as V4Context;
        await this.showModifyDialog(lectureContext, this.resourceBundle.getText("modifyDialogTitle"));
    }

    public handleDeleteLecture(): void {
        const popover = this.getView().byId("detailsPopover") as Popover,
            lectureContext = popover.getBindingContext() as V4Context;
        popover.close();
        lectureContext.delete('$auto').then(() => {
            MessageToast.show(this.resourceBundle.getText("lectureDeleted"));
        }, (error: Error) => {
            MessageToast.show(this.resourceBundle.getText("deleteErrInfo", [error.message]));
        });
    }

    public handleSave(): void {
        const view = this.getView(),
            model = view.getModel() as ODataModel,
            lectureContext = view.byId("lectureDialogForm").getBindingContext() as V4Context,
            dialog = view.byId("lectureDialog") as Dialog;

        if (this.validateLectureForm()) {
            model.submitBatch("LectureUpdateGroup").then(() => {
                if (!lectureContext.getBinding().hasPendingChanges()) {
                    dialog.close();
                    MessageToast.show(this.resourceBundle.getText("lectureSaved"));
                } else {
                    MessageToast.show(this.resourceBundle.getText("saveErr"));
                }
                model.refresh();
            }, (error: Error) => {
                MessageToast.show(this.resourceBundle.getText("saveErrInfo", [error.message]));
            });
        }
    }

    public handleClose(): void {
        const model = this.getView().getModel() as ODataModel,
            dialog = this.getView().byId("lectureDialog") as Dialog;

        model.resetChanges("LectureUpdateGroup");
        dialog.close();
    }

    public async handleCreateEvent(): Promise<void> {
        await this.showEventDialog();
    }

    public handleEventSave(): void {
        const model = this.getView().getModel() as ODataModel,
            objectBinding = this.getView().byId("lectureEventDialogForm").getObjectBinding() as ODataContextBinding,
            dialog = this.getView().byId("lectureEventDialog") as Dialog;

        if (this.validateAlldayEventForm()) {
            objectBinding.execute().then(() => {
                model.refresh();
                this.resetEventDialog();
                dialog.close();
                MessageToast.show(this.resourceBundle.getText("eventCreated"));
            }, (error: Error) => {
                MessageToast.show(this.resourceBundle.getText("eventCreateErrInfo", [error.message]));
            });
        }
    }

    public handleEventClose(): void {
        const model = this.getView().getModel() as ODataModel,
            dialog = this.getView().byId("lectureEventDialog") as Dialog;

        model.resetChanges("LectureUpdateGroup");
        this.resetEventDialog();
        dialog.close();
    }

    public handleResizeLecture(event: Event): void {
        const appointment = event.getParameter("appointment") as CalendarAppointment,
            lectureContext = appointment.getBindingContext() as V4Context,
            model = this.getView().getModel() as ODataModel,
            starttime = event.getParameter("startDate") as DateTimeOffset,
            endtime = event.getParameter("endDate") as DateTimeOffset,
            appointmentTitle = appointment.getTitle();

        appointment.setStartDate(starttime);
        appointment.setEndDate(endtime);

        model.submitBatch("LectureUpdateGroup").then(() => {
            if (!lectureContext.hasPendingChanges()) {
                model.refresh();
                MessageToast.show(this.resourceBundle.getText("lectureResized", [appointmentTitle]));
            } else {
                model.resetChanges("LectureUpdateGroup");
                MessageToast.show(this.resourceBundle.getText("modifyErr"));
            }
        }, (error: Error) => {
            MessageToast.show(this.resourceBundle.getText("modifyErrInfo", [error.message]));
        });
    }

    public handleComboBoxChange(event: Event): void {
        const comboBox = event.getSource() as ComboBox,
            selectedKey = comboBox.getSelectedKey(),
            value = comboBox.getValue();

        if (!selectedKey && value) {
            comboBox.setValueState(ValueState.Error);
            comboBox.setValueStateText(this.resourceBundle.getText("inputErr"));
        } else {
            comboBox.setValueState(ValueState.None);
        }
    }

    public handleDtpChange(event: Event): void {
        const valid = event.getParameter("valid") as boolean,
            dateTimePicker = event.getSource() as DateTimePicker;

        if (!valid) {
            dateTimePicker.setValueState(ValueState.Error);
            dateTimePicker.setValueStateText(this.resourceBundle.getText("inputErr"));
        } else {
            dateTimePicker.setValueState(ValueState.None);
        }
    }

    public handleNumberInputError(event: Event): void {
        const numberInput = event.getSource() as Input;
        numberInput.setValueState(ValueState.Error);
        numberInput.setValueStateText(this.resourceBundle.getText("inputErr"));
    }

    public handleNumberInputSuccess(event: Event): void {
        const numberInput = event.getSource() as Input;
        numberInput.setValueState(ValueState.None);
    }

    private async showDetailsPopover(appointment: CalendarAppointment): Promise<void> {
        if (!this.appointmentPopover) {
            try {
                this.appointmentPopover = await this.loadFragment({
                    name: "lectures.fragments.AppointmentPopover"
                }) as Popover;
            } catch (error) {
                console.log(this.resourceBundle.getText("fragmentLoadErr", [error]));
            }
        }

        this.appointmentPopover.setBindingContext(appointment.getBindingContext());
        this.appointmentPopover.openBy(appointment, false);
    }

    public async showModifyDialog(lectureContext: V4Context, title: string): Promise<void> {
        if (!this.lectureFormDialog) {
            try {
                this.lectureFormDialog = await this.loadFragment({
                    name: "lectures.fragments.LectureFormDialog"
                }) as Dialog;
            } catch (error) {
                console.log(this.resourceBundle.getText("fragmentLoadErr", [error]));
            }
        }

        this.lectureFormDialog.setBindingContext(lectureContext);
        this.lectureFormDialog.setTitle(title);
        this.lectureFormDialog.open();
    }

    private async showEventDialog(): Promise<void> {
        if (!this.alldayFormDialog) {
            try {
                this.alldayFormDialog = await this.loadFragment({
                    name: "lectures.fragments.AlldayFormDialog"
                }) as Dialog;
            } catch (error) {
                console.log(this.resourceBundle.getText("fragmentLoadErr", [error]));
            }
        }

        this.alldayFormDialog.open();
    }

    private resetEventDialog(): void {
        const reqSeatsInput = this.getView().byId("reqSeatsInput") as Input,
            alldayEventDtp = this.getView().byId("dtpAlldayEvent") as DateTimePicker;
        reqSeatsInput.setValue("");
        alldayEventDtp.setValue("");
    }

    private validateAlldayEventForm(): boolean {
        const numberInput = this.getView().byId("reqSeatsInput") as Input,
            dateDtp = this.getView().byId("dtpAlldayEvent") as DateTimePicker,
            numberValueState = numberInput.getValueState() as ValueState,
            dateValueState = dateDtp.getValueState() as ValueState;

        if (numberInput.getValue() != "" && dateDtp.getValue() != "") {
            if (numberValueState == ValueState.None && dateValueState == ValueState.None) {
                return true;
            } else {
                MessageToast.show(this.resourceBundle.getText("validationErr"));
            }

        } else {
            MessageToast.show(this.resourceBundle.getText("reqFieldsErr"));
        }

        return false;
    }

    private validateLectureForm(): boolean {
        const courseComboBox = this.getView().byId("courseComboBox") as ComboBox,
            profComboBox = this.getView().byId("profComboBox") as ComboBox,
            roomComboBox = this.getView().byId("roomComboBox") as ComboBox,
            startDtp = this.getView().byId("dtpStartDate") as DateTimePicker,
            endDtp = this.getView().byId("dtpEndDate") as DateTimePicker,
            courseValueState = courseComboBox.getValueState() as ValueState,
            profValueState = profComboBox.getValueState() as ValueState,
            roomValueState = roomComboBox.getValueState() as ValueState,
            startValueState = startDtp.getValueState() as ValueState,
            endValueState = endDtp.getValueState() as ValueState;

        if (roomComboBox.getValue() != "" && startDtp.getValue() != "" && endDtp.getValue() != "") {
            if (courseValueState == ValueState.None &&
                profValueState == ValueState.None &&
                roomValueState == ValueState.None &&
                startValueState == ValueState.None &&
                endValueState == ValueState.None) {
                return true;
            } else {
                MessageToast.show(this.resourceBundle.getText("validationErr"));
            }

        } else {
            MessageToast.show(this.resourceBundle.getText("reqFieldsErr"));
        }

        return false;
    }

    public async getResourceBundle(): Promise<ResourceBundle> {
        const i18nModel = this.getOwnerComponent().getModel("i18n") as ResourceModel;
        return i18nModel.getResourceBundle();
    }
}
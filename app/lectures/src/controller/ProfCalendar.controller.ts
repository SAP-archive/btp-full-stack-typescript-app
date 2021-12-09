import BaseController from "./BaseController";
import MessageToast from "sap/m/MessageToast";
import SinglePlanningCalendarDayView from "sap/m/SinglePlanningCalendarDayView";
import SinglePlanningCalendarWorkWeekView from "sap/m/SinglePlanningCalendarWorkWeekView";
import SinglePlanningCalendarWeekView from "sap/m/SinglePlanningCalendarWeekView";
import SinglePlanningCalendar from "sap/m/SinglePlanningCalendar";
import Event from "sap/ui/base/Event";
import DateTimeOffset from "sap/ui/model/odata/type/DateTimeOffset";
import Context from "sap/ui/model/odata/v4/Context";
import CalendarAppointment from "sap/ui/unified/CalendarAppointment";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import ComboBox from "sap/m/ComboBox";
import { ValueState } from "sap/ui/core/library";
import FilterType from "sap/ui/model/FilterType";
import FilterOperator from "sap/ui/model/FilterOperator";
import Filter from "sap/ui/model/Filter";

/**
 * @namespace lectures.controller
 */
export default class LecturesDetail extends BaseController {

    public async onInit(): Promise<void> {
        await super.onInit();

        const SPC = this.getView().byId("profCalendar") as SinglePlanningCalendar,
            dayView = new SinglePlanningCalendarDayView("dayView", {
                title: this.resourceBundle.getText("dayView"),
                key: "Day"
            }),
            workWeekView = new SinglePlanningCalendarWorkWeekView("workWeekView", {
                key: this.resourceBundle.getText("workWeekView"),
                title: "Work Week"
            }),
            weekView = new SinglePlanningCalendarWeekView("weekView", {
                key: this.resourceBundle.getText("weekView"),
                title: "Week"
            });

        SPC.addView(dayView);
        SPC.addView(workWeekView);
        SPC.addView(weekView);

        SPC.setSelectedView("workWeekView");
    }

    public async handleCreateLecture(event: Event): Promise<void> {
        const starttime = event.getParameter("startDate") as DateTimeOffset,
            endtime = event.getParameter("endDate") as DateTimeOffset,
            appointmentsBinding = this.getView().byId("profCalendar").getBinding("appointments") as ODataListBinding;
        const lectureContext = appointmentsBinding.create({
            starttime: starttime,
            endtime: endtime
        });
        await this.showModifyDialog(lectureContext, this.resourceBundle.getText("createDialogTitle"));
    }

    public handleDropLecture(event: Event): void {
        const model = this.getView().getModel() as ODataModel,
            appointment = event.getParameter("appointment") as CalendarAppointment,
            lectureContext = appointment.getBindingContext() as Context,
            starttime = event.getParameter("startDate") as DateTimeOffset,
            endtime = event.getParameter("endDate") as DateTimeOffset,
            copy = event.getParameter("copy") as boolean,
            appointmentsBinding = this.getView().byId("profCalendar").getBinding("appointments") as ODataListBinding,
            appointmentTitle = appointment.getTitle();

        if (copy) {
            appointmentsBinding.create({
                course_ID: lectureContext.getProperty("course/ID") as string,
                room_ID: lectureContext.getProperty("room/ID") as int,
                prof_ID: lectureContext.getProperty("prof/ID") as int,
                starttime: starttime,
                endtime: endtime
            });
        } else {
            appointment.setStartDate(starttime);
            appointment.setEndDate(endtime);
        }

        model.submitBatch("LectureUpdateGroup").then(() => {
            if (!lectureContext.hasPendingChanges()) {
                this.getView().getModel().refresh();
                MessageToast.show(copy ?
                    this.resourceBundle.getText("lectureCreated", [appointmentTitle]) :
                    this.resourceBundle.getText("lectureMoved", [appointmentTitle]));
            } else {
                model.resetChanges("LectureUpdateGroup");
                MessageToast.show(this.resourceBundle.getText("modifyErr"));
            }
        }, (error: Error) => {
            MessageToast.show(this.resourceBundle.getText("modifyErrInfo", [error.message]));
        });
    }

    public handleFilter(event: Event): void {
        const comboBox = event.getSource() as ComboBox,
            selectedKey = comboBox.getSelectedKey(),
            filterValue = comboBox.getValue(),
            appointmentsBinding = this.getView().byId("profCalendar").getBinding("appointments") as ODataListBinding;

        if (!selectedKey && filterValue) {
            comboBox.setValueState(ValueState.Error);
            comboBox.setValueStateText(this.resourceBundle.getText("inputErr"));
        } else if (!selectedKey && !filterValue) {
            comboBox.setValueState(ValueState.None);
            appointmentsBinding.filter([]);
        } else if (selectedKey) {
            comboBox.setValueState(ValueState.None);
            appointmentsBinding.filter(new Filter("prof_ID", FilterOperator.EQ, selectedKey), FilterType.Application);
        }
    }

}
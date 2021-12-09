import BaseController from "./BaseController";
import MessageToast from "sap/m/MessageToast";
import Event from "sap/ui/base/Event";
import DateTimeOffset from "sap/ui/model/odata/type/DateTimeOffset";
import Context from "sap/ui/model/odata/v4/Context";
import PlanningCalendarRow from "sap/m/PlanningCalendarRow";
import PlanningCalendar from "sap/m/PlanningCalendar";
import CalendarAppointment from "sap/ui/unified/CalendarAppointment";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import { PlanningCalendarBuiltInView } from "sap/m/library";

/**
 * @namespace lectures.controller
 */
export default class LecturesOverview extends BaseController {

    public async onInit(): Promise<void> {
        await super.onInit();

        const PC = this.getView().byId("roomCalendar") as PlanningCalendar;
        PC.setBuiltInViews([
            PlanningCalendarBuiltInView.Hour,
            PlanningCalendarBuiltInView.Day,
            PlanningCalendarBuiltInView.Week
        ]);
    }

    public onAfterRendering(): void {
        if (this.getView().byId("roomCalendar").getBinding("rows").isSuspended())
            this.getView().byId("roomCalendar").getBinding("rows").resume();
    }

    public async handleCreateLecture(event: Event): Promise<void> {
        const starttime = event.getParameter("startDate") as DateTimeOffset,
            endtime = event.getParameter("endDate") as DateTimeOffset,
            row = event.getParameter("calendarRow") as PlanningCalendarRow,
            rowBinding = row.getBinding("appointments") as ODataListBinding;

        const lectureContext = rowBinding.create({
            starttime: starttime,
            endtime: endtime,
            room_ID: parseInt(row.getKey())
        });
        await this.showModifyDialog(lectureContext, this.resourceBundle.getText("createDialogTitle"));
    }

    public async handleCreateLectureButton(): Promise<void> {
        const PC = this.getView().byId("roomCalendar") as PlanningCalendar,
            rowBinding = PC.getRows()[0].getBinding("appointments") as ODataListBinding,
            lectureContext = rowBinding.create();
        await this.showModifyDialog(lectureContext, this.resourceBundle.getText("createDialogTitle"));
    }

    public handleDropLecture(event: Event): void {
        const model = this.getView().getModel() as ODataModel,
            appointment = event.getParameter("appointment") as CalendarAppointment,
            lectureContext = appointment.getBindingContext() as Context,
            starttime = event.getParameter("startDate") as DateTimeOffset,
            endtime = event.getParameter("endDate") as DateTimeOffset,
            row = event.getParameter("calendarRow") as PlanningCalendarRow,
            copy = event.getParameter("copy") as boolean,
            rowBinding = row.getBinding("appointments") as ODataListBinding,
            appointmentTitle = appointment.getTitle();

        if (copy) {
            rowBinding.create({
                course_ID: lectureContext.getProperty("course/ID") as int,
                room_ID: parseInt(row.getKey()),
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
}
import BaseController from "lectures/controller/BaseController";
import { CalendarDayType } from "sap/ui/unified/library";

/**
 * @namespace lectures.model
 */
export default class Formatter {

    public lectureDetails(this: BaseController, courseDescr: string, profFirstname: string, profLastname: string, profTitle: string, roomName: string): string {
        const name = this.formatter.professorName(profFirstname, profLastname, profTitle);
        const course = courseDescr ? courseDescr : "";
        const room = roomName ? `[${roomName}]` : "";
        return [course, room, name].join(' ');
    }

    public professorName(firstname: string, lastname: string, title: string): string {
        if (!firstname && !lastname)
            return "";
        let name = `${firstname} ${lastname}`;
        if (title) {
            name += `, ${title}`;
        }
        return name;
    }

    public appointmentTitle(this: BaseController, courseName: string, roomName: string): string {
        return courseName ? courseName : this.resourceBundle.getText("lecture", [roomName]);
    }

    public hasAdminRole(infoLoaded: boolean, roles: string[]): boolean {
        if (infoLoaded)
            return roles ? roles.includes("LectureScheduleAdmin") : false;
        return true;
    }

    public userInitials(firstname: string, lastname: string): string {
        return (firstname && lastname) ? firstname.substring(0, 1) + lastname.substring(0, 1) : "";
    }

    public lectureType(allday: boolean): CalendarDayType {
        return allday ? CalendarDayType.Type05 : CalendarDayType.Type07;
    }

    public lectureIcon(allday: boolean): string {
        return allday ? "sap-icon://marketing-campaign" : "sap-icon://education";
    }
}
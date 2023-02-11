import { Service } from "@sap/cds/apis/services";
import { Lecture, Room, AlldayEvent } from "./entities";

export = (srv: Service) => {

    const { Rooms, Lectures } = srv.entities;

    srv.before('CREATE', 'Lectures', async (req) => {
        const data = req.data as Lecture,
            { starttime, endtime, room_ID } = data;

        const start = new Date(starttime).toISOString(),
            end = new Date(endtime).toISOString();

        let lectures = [];
        lectures = await srv.read(Lectures).where({
            room_ID: room_ID, and: {
                starttime: { '>': start }, and: { starttime: { '<': end } },
                or: {
                    endtime: { '>': start }, and: { endtime: { '<': end } },
                    or: { starttime: { '<': start }, and: { endtime: { '>': end } } }
                }
            }
        }) as Lecture[];
        if (lectures.length > 0)
            return req.error(400, "SELECTED_ROOM_NOT_AVAILABLE")
    })

    srv.before('UPDATE', 'Lectures', async (req) => {
        const data = req.data as Lecture,
            { ID, starttime, endtime, room_ID } = data;

        const lecture = await srv.read(Lectures).where({ ID: ID }).limit(1) as Lecture[];
        const start = starttime ? new Date(starttime).toISOString() : lecture[0].starttime,
            end = endtime ? new Date(endtime).toISOString() : lecture[0].endtime,
            roomID = room_ID ? room_ID : lecture[0].room_ID;

        let lectures = [];
        lectures = await srv.read(Lectures).where({
            room_ID: roomID, and: {
                ID: { '<>': ID }, and: {
                    starttime: { '>': start }, and: { starttime: { '<': end } },
                    or: {
                        endtime: { '>': start }, and: { endtime: { '<': end } },
                        or: { starttime: { '<': start }, and: { endtime: { '>': end } } }
                    }
                }
            },
        }) as Lecture[];
        if (lectures.length > 0)
            return req.error(400, "SELECTED_ROOM_NOT_AVAILABLE")
    })

    srv.on('createEvent', async (req) => {
        const data = req.data as AlldayEvent,
            { reqSeats, date } = data;

        const startDate = new Date(date),
            endDate = new Date(date);
        endDate.setDate(startDate.getDate() + 1);
        endDate.setTime(endDate.getTime() - 1000);

        const overlappingLectures = await srv.read(Lectures)
            .where({
                starttime: { between: startDate.toISOString(), and: endDate.toISOString() },
                or: { endtime: { between: startDate.toISOString(), and: endDate.toISOString() } }
            }).columns('room_ID') as Lecture[];
        const bookedRoomIDs = overlappingLectures.map(r => r.room_ID);

        let rooms;
        if (bookedRoomIDs.length >= 1) {
            rooms = await srv.read(Rooms).where({
                seats: { '>=': reqSeats },
                and: { ID: { 'NOT IN': bookedRoomIDs } }
            }).orderBy('seats asc').limit(1) as Room[];
        } else {
            rooms = await srv.read(Rooms).where({
                seats: { '>=': reqSeats }
            }).orderBy('seats asc').limit(1) as Room[];
        }

        if (rooms.length > 0) {
            const lecture = await srv.create(Lectures).entries({
                "starttime": startDate,
                "endtime": endDate,
                "course_ID": null,
                "prof_ID": null,
                "room_ID": rooms[0].ID
            }) as Lecture;
            return lecture;
        } else {
            return req.error(400, "NO_MATCHING_ROOMS_AVAILABLE")
        }
    })

    srv.after('READ', 'Lectures', (each) => {
        const lecture = each as Lecture;
        if (lecture.starttime && lecture.endtime) {
            const start = new Date(lecture.starttime),
                end = new Date(lecture.endtime);
            start.setDate(start.getDate() + 1);
            start.setTime(start.getTime() - 1000);
            lecture.allday = (start.toISOString() == end.toISOString() || new Date(lecture.starttime).toISOString() == end.toISOString());
        }
    })

    srv.after('READ', 'Rooms', (each) => {
        const room = each as Room;
        if (room.lectures) {
            for (const lecture of room.lectures) {
                const start = new Date(lecture.starttime),
                    end = new Date(lecture.endtime);
                start.setDate(start.getDate() + 1);
                start.setTime(start.getTime() - 1000);
                lecture.allday = (start.toISOString() == end.toISOString() || new Date(lecture.starttime).toISOString() == end.toISOString());
            }
        }
    })

}
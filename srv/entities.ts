interface Room {
    ID: number,
    name: string,
    seats: number
    lectures: Lecture[]
}

interface Course {
    ID: string,
    name: string,
    descr: string,
    ects: number,
    lectures: Lecture[]
}

interface Professor {
    ID: number,
    firstname: string,
    lastname: string,
    title: string,
    lectures: Lecture[]
}

interface Lecture {
    ID: number,
    starttime: Date,
    endtime: Date,
    course: Course,
    course_ID: string,
    prof: Professor,
    prof_ID: number,
    room: Room,
    room_ID: number,
    allday: boolean
}

interface AlldayEvent {
    reqSeats: number,
    date: Date
}

export {
    Room,
    Course,
    Professor,
    Lecture,
    AlldayEvent
}
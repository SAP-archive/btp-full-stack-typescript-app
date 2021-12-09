using {lectureschedule as my} from '../db/schema';

@path : 'service/lectureSchedule'
service LectureService {

    entity Lectures @(restrict : [
        {
            grant : ['READ'],
            to    : ['viewer']
        },
        {
            grant : ['*'],
            to    : ['admin']
        }
    ]) as projection on my.Lectures;

    entity Rooms @(restrict : [
        {
            grant : ['READ'],
            to    : ['viewer']
        },
        {
            grant : ['*'],
            to    : ['admin']
        }
    ]) as projection on my.Rooms;

    entity Courses @(restrict : [
        {
            grant : ['READ'],
            to    : ['viewer']
        },
        {
            grant : ['*'],
            to    : ['admin']
        }
    ]) as projection on my.Courses;

    entity Professors @(restrict : [
        {
            grant : ['READ'],
            to    : ['viewer']
        },
        {
            grant : ['*'],
            to    : ['admin']
        }
    ]) as projection on my.Professors;

    @requires : 'admin'
    action createEvent(reqSeats : Integer, date : DateTime) returns Lectures;

}

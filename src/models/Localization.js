/**
 * Returns weekday abbreviation from Date object.
 * @param {Date} date
 * @returns string
 */
export function getWeekdayNameShort(date) {
    if (typeof date instanceof Date) {
        throw new Error('Parameter is not an instance of class Date');
    }

    var weekdays = new Array(7);
    weekdays[0] = 'Sun';
    weekdays[1] = 'Mon';
    weekdays[2] = 'Tue';
    weekdays[3] = 'Wed';
    weekdays[4] = 'Thu';
    weekdays[5] = 'Fri';
    weekdays[6] = 'Sat';

    return weekdays[date.getDay()];
}

/**
 * Returns month abbreviation from Date object.
 * @param {Date} date
 * @returns string
 */
export function getMonthNameShort(date) {
    if (typeof date instanceof Date) {
        throw new Error('Parameter is not an instance of class Date');
    }

    var months = new Array(12);
    months[0] = 'Jan';
    months[1] = 'Feb';
    months[2] = 'Mar';
    months[3] = 'Apr';
    months[4] = 'May';
    months[5] = 'Jun';
    months[6] = 'Jul';
    months[7] = 'Aug';
    months[8] = 'Sep';
    months[9] = 'Oct';
    months[10] = 'Nov';
    months[11] = 'Dec';

    return months[date.getMonth()];
}


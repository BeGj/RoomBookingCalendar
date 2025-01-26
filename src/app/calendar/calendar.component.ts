import { NgClass } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

interface Day {
	dayOfMonth: number;
	busy: boolean;
	bookings: Booking[];
	isToday: boolean;
	isCurrentMonth: boolean;
	isWeekend: boolean;
}

interface CalendarView {
	weeks: {
		days: Day[];
		weekNumber: number;
	}[];
	monthName: string;
	year: number;
}

interface Booking {
	date: Date;
	private: boolean;
	name: string;
	roomName: string;
}

@Component({
	imports: [NgClass],
	selector: 'app-calendar',
	templateUrl: './calendar.component.html',
	styleUrl: './calendar.component.css',
})
export class CalendarComponent {
	selectedRoomName = input<string | undefined>(undefined);
	now = new Date();
	month = signal(this.now.getMonth() + 1);
	day = signal(this.now.getDate());
	year = signal(this.now.getFullYear());

	bookings = signal<Booking[]>([
		{
			date: new Date(2025, 0, 1),
			name: 'Ola Nordmann',
			private: false,
			roomName: 'Veslestua',
		},
		{
			date: new Date(2025, 0, 31),
			name: 'Kari Nordmann',
			private: true,
			roomName: 'Fellesrommet',
		},
	]);

	dayInMonth = computed(() => {
		const month = this.month();
		const year = this.year();
		return dayjs(`${year}-${month}-01`).daysInMonth();
	});

	startingWeekdayOfMonth = computed(() => {
		const month = this.month();
		const year = this.year();
		// Adjust to make Monday the first day of the week
		const day = dayjs(`${year}-${month}-01`).day();
		return day === 0 ? 6 : day - 1;
	});

	rowsAndColumns = computed(() => {
		const dayInMonth = this.dayInMonth();
		const startingWeekdayOfMonth = this.startingWeekdayOfMonth();
		const rows = Math.ceil((dayInMonth + startingWeekdayOfMonth) / 7);
		const columns = 7;
		return { rows, columns };
	});

	calendarView = computed<CalendarView>(() => {
		const { rows, columns } = this.rowsAndColumns();
		const dayInMonth = this.dayInMonth();
		const startingWeekdayOfMonth = this.startingWeekdayOfMonth();
		const selectedRoomName = this.selectedRoomName();
		const weeks: CalendarView['weeks'] = [];
		const bookings = this.bookings();
		let day = 1;
		const previousMonthDays = dayjs(
			`${this.year()}-${this.month() - 1}-01`
		).daysInMonth();
		for (let i = 0; i < rows; i++) {
			const days: Day[] = [];
			let weekNumber = dayjs(
				`${this.year()}-${this.month()}-${day}`
			).isoWeek();
			for (let j = 0; j < columns; j++) {
				if (i === 0 && j < startingWeekdayOfMonth) {
					const currentDate = new Date(
						this.year(),
						this.month() - 2,
						previousMonthDays - (startingWeekdayOfMonth - j - 1)
					);
					const dayBookings = bookings.filter(
						booking =>
							dayjs(currentDate).isSame(booking.date, 'day') &&
							(!selectedRoomName ||
								booking.roomName === selectedRoomName)
					);
					const busy = dayBookings.length > 0;
					days.push({
						dayOfMonth:
							previousMonthDays -
							(startingWeekdayOfMonth - j - 1),
						bookings: dayBookings,
						busy,
						isToday: dayjs(currentDate).isSame(this.now, 'day'),
						isCurrentMonth: false,
						isWeekend: j === 5 || j === 6,
					});
				} else if (day > dayInMonth) {
					const currentDate = new Date(
						this.year(),
						this.month(),
						day - dayInMonth
					);
					const dayBookings = bookings.filter(
						booking =>
							dayjs(currentDate).isSame(booking.date, 'day') &&
							(!selectedRoomName ||
								booking.roomName === selectedRoomName)
					);
					const busy = dayBookings.length > 0;
					days.push({
						dayOfMonth: day - dayInMonth,
						bookings: dayBookings,
						busy,
						isToday: dayjs(currentDate).isSame(this.now, 'day'),
						isCurrentMonth: false,
						isWeekend: j === 5 || j === 6,
					});
					day++;
				} else {
					const currentDate = new Date(
						this.year(),
						this.month() - 1,
						day
					);
					const dayBookings = this.bookings().filter(
						booking =>
							dayjs(currentDate).isSame(booking.date, 'day') &&
							(!selectedRoomName ||
								booking.roomName === selectedRoomName)
					);

					const busy = dayBookings.length > 0;
					days.push({
						dayOfMonth: day,
						bookings: dayBookings,
						busy,
						isToday: dayjs(currentDate).isSame(this.now, 'day'),
						isCurrentMonth: true,
						isWeekend: j === 5 || j === 6,
					});
					weekNumber = dayjs(
						`${this.year()}-${this.month()}-${day}`
					).isoWeek();
					day++;
				}
			}
			weeks.push({ days, weekNumber });
		}
		return {
			weeks,
			monthName: dayjs(`${this.year()}-${this.month()}-01`).format(
				'MMMM'
			),
			year: this.year(),
		};
	});

	previousMonth() {
		const currentMonth = this.month();
		const previousMonth = currentMonth - 1;
		if (previousMonth < 1) {
			this.month.set(12);
			this.year.update(y => y - 1);
		} else {
			this.month.set(previousMonth);
		}
	}

	nextMonth() {
		const currentMonth = this.month();
		const nextMonth = currentMonth + 1;
		if (nextMonth > 12) {
			this.month.set(1);
			this.year.update(y => y + 1);
		} else {
			this.month.set(nextMonth);
		}
	}
	previousYear() {
		this.year.update(y => y - 1);
	}

	nextYear() {
		this.year.update(y => y + 1);
	}
	setToday() {
		this.month.set(this.now.getMonth() + 1);
		this.year.set(this.now.getFullYear());
	}
}

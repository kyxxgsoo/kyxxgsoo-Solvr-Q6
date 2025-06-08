import { PrismaClient } from '@prisma/client';
import { addDays, formatISO } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // 기존 데이터 삭제 (선택 사항)
  await prisma.sleep.deleteMany({});

  const today = new Date();

  const dummySleepData = [
    {
      startTime: formatISO(addDays(today, -10).setHours(22, 0, 0, 0)),
      endTime: formatISO(addDays(today, -9).setHours(6, 30, 0, 0)),
      note: '주말 푹잠',
    },
    {
      startTime: formatISO(addDays(today, -9).setHours(23, 0, 0, 0)),
      endTime: formatISO(addDays(today, -8).setHours(7, 0, 0, 0)),
      note: '평소와 같음',
    },
    {
      startTime: formatISO(addDays(today, -8).setHours(22, 30, 0, 0)),
      endTime: formatISO(addDays(today, -7).setHours(5, 0, 0, 0)),
      note: '늦게 잠들고 일찍 일어남',
    },
    {
      startTime: formatISO(addDays(today, -7).setHours(21, 0, 0, 0)),
      endTime: formatISO(addDays(today, -6).setHours(7, 0, 0, 0)),
      note: '매우 긴 수면',
    },
    {
      startTime: formatISO(addDays(today, -6).setHours(23, 0, 0, 0)),
      endTime: formatISO(addDays(today, -5).setHours(7, 0, 0, 0)),
      note: '숙면을 취함',
    },
    {
      startTime: formatISO(addDays(today, -5).setHours(22, 30, 0, 0)),
      endTime: formatISO(addDays(today, -4).setHours(6, 30, 0, 0)),
      note: '꿈을 많이 꿈',
    },
    {
      startTime: formatISO(addDays(today, -4).setHours(23, 0, 0, 0)),
      endTime: formatISO(addDays(today, -3).setHours(7, 30, 0, 0)),
      note: '늦잠을 잠',
    },
    {
      startTime: formatISO(addDays(today, -3).setHours(20, 0, 0, 0)),
      endTime: formatISO(addDays(today, -3).setHours(21, 0, 0, 0)),
      note: '추가 수면 기록',
    },
    {
      startTime: formatISO(addDays(today, -3).setHours(22, 0, 0, 0)),
      endTime: formatISO(addDays(today, -2).setHours(5, 0, 0, 0)),
      note: '일찍 일어남',
    },
    {
      startTime: formatISO(addDays(today, -2).setHours(23, 0, 0, 0)),
      endTime: formatISO(addDays(today, -1).setHours(8, 0, 0, 0)),
      note: '개운하게 일어남',
    },
    {
      startTime: formatISO(addDays(today, -1).setHours(22, 0, 0, 0)),
      endTime: formatISO(addDays(today, 0).setHours(6, 0, 0, 0)),
      note: '약간 피곤함',
    },
    {
      startTime: formatISO(addDays(today, 0).setHours(23, 0, 0, 0)),
      endTime: formatISO(addDays(today, 1).setHours(7, 0, 0, 0)),
      note: '오늘 수면 기록',
    },
  ];

  for (const data of dummySleepData) {
    await prisma.sleep.create({
      data: {
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        note: data.note,
      },
    });
  }

  console.log('Dummy sleep data seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
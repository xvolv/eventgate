import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create some clubs if they don't exist
  const clubsData = [
    { id: "computer-science-club", name: "Computer Science Club" },
    { id: "debate-society", name: "Debate Society" },
    { id: "music-club", name: "Music Club" },
    { id: "sports-club", name: "Sports Club" },
  ];

  for (const club of clubsData) {
    await prisma.club.upsert({
      where: { id: club.id },
      update: {},
      create: club,
    });
  }

  // Current date for reference
  const now = new Date();

  // Create upcoming events (startTime in the future)
  const upcomingEvents = [
    {
      title: "Annual Tech Summit 2026",
      description: "Join us for the biggest technology event of the year featuring guest speakers, workshops, and networking opportunities. Learn about AI, blockchain, and the future of technology from industry experts.",
      location: "Main Auditorium, Computer Science Building",
      clubId: "computer-science-club",
      submittedBy: "csc-president@aau.edu.et",
      startDaysFromNow: 7, // 7 days from now
      endDaysFromNow: 8,
    },
    {
      title: "Inter-University Debate Championship",
      description: "The annual debate championship brings together the brightest minds from universities across Ethiopia. Compete for the championship trophy and represent your university with pride.",
      location: "Conference Hall, Building A",
      clubId: "debate-society",
      submittedBy: "debate-president@aau.edu.et",
      startDaysFromNow: 14,
      endDaysFromNow: 15,
    },
    {
      title: "Spring Music Festival",
      description: "Experience the melodic chaos of our annual spring music festival. Featuring student bands, solo performances, and special guest artists. Food and refreshments available.",
      location: "Open Air Theater",
      clubId: "music-club",
      submittedBy: "music-president@aau.edu.et",
      startDaysFromNow: 21,
      endDaysFromNow: 22,
    },
    {
      title: "Career Fair 2026",
      description: "Connect with top employers from across Ethiopia. Bring your CV and dress professionally for this networking opportunity.",
      location: "Main Campus Quad",
      clubId: "sports-club",
      submittedBy: "sports-president@aau.edu.et",
      startDaysFromNow: 28,
      endDaysFromNow: 29,
    },
    {
      title: "Science Exhibition",
      description: "Showcase your scientific projects and discoveries. Open to all departments and faculties.",
      location: "Science Building Atrium",
      clubId: "computer-science-club",
      submittedBy: "csc-president@aau.edu.et",
      startDaysFromNow: 35,
      endDaysFromNow: 36,
    },
    {
      title: "Cultural Day Celebration",
      description: "Celebrate the diversity of Ethiopia through music, dance, food, and traditional costumes from all regions.",
      location: "Student Center Plaza",
      clubId: "music-club",
      submittedBy: "music-president@aau.edu.et",
      startDaysFromNow: 42,
      endDaysFromNow: 43,
    },
    {
      title: "Sports Day",
      description: "Annual athletics competition featuring running, jumping, and team sports. Represent your department!",
      location: "University Stadium",
      clubId: "sports-club",
      submittedBy: "sports-president@aau.edu.et",
      startDaysFromNow: 49,
      endDaysFromNow: 50,
    },
    {
      title: "Photography Workshop",
      description: "Learn professional photography techniques from expert photographers. Bring your camera!",
      location: "Arts Building Room 101",
      clubId: "debate-society",
      submittedBy: "debate-president@aau.edu.et",
      startDaysFromNow: 56,
      endDaysFromNow: 57,
    },
    {
      title: "Entrepreneurship Summit",
      description: "Learn how to start your own business and meet successful entrepreneurs who started at AAU.",
      location: "Business School Auditorium",
      clubId: "computer-science-club",
      submittedBy: "csc-president@aau.edu.et",
      startDaysFromNow: 63,
      endDaysFromNow: 64,
    },
    {
      title: "Art Exhibition",
      description: "Student art showcase featuring paintings, sculptures, and digital art.",
      location: "Gallery Hall",
      clubId: "music-club",
      submittedBy: "music-president@aau.edu.et",
      startDaysFromNow: 70,
      endDaysFromNow: 71,
    },
  ];

  // Create passed events (endTime in the past)
  const passedEvents = [
    {
      title: "Welcome Week Kickoff",
      description: "The official start of the academic year! Meet your fellow students, explore clubs, and learn about opportunities to get involved in campus life.",
      location: "Student Center Plaza",
      clubId: "sports-club",
      submittedBy: "sports-president@aau.edu.et",
      startDaysAgo: 30,
      endDaysAgo: 29,
    },
    {
      title: "Hackathon 2026",
      description: "A 48-hour coding marathon where students compete to build innovative solutions to real-world problems. Prizes worth 50,000 ETB!",
      location: "Innovation Hub",
      clubId: "computer-science-club",
      submittedBy: "csc-president@aau.edu.et",
      startDaysAgo: 45,
      endDaysAgo: 43,
    },
    {
      title: "Freshers' Night",
      description: "The biggest party of the year for new students! Music, dancing, and fun.",
      location: "Open Air Theater",
      clubId: "music-club",
      submittedBy: "music-president@aau.edu.et",
      startDaysAgo: 60,
      endDaysAgo: 59,
    },
    {
      title: "Research Symposium",
      description: "Graduate students present their research findings to the academic community.",
      location: "Conference Center",
      clubId: "debate-society",
      submittedBy: "debate-president@aau.edu.et",
      startDaysAgo: 75,
      endDaysAgo: 74,
    },
    {
      title: "Football Tournament",
      description: "Inter-department football championship. Cheer for your team!",
      location: "University Football Field",
      clubId: "sports-club",
      submittedBy: "sports-president@aau.edu.et",
      startDaysAgo: 90,
      endDaysAgo: 89,
    },
    {
      title: " poetry Night",
      description: "An evening of poetry reading and spoken word performances.",
      location: "Literature Hall",
      clubId: "debate-society",
      submittedBy: "debate-president@aau.edu.et",
      startDaysAgo: 105,
      endDaysAgo: 104,
    },
    {
      title: "Tech Talk: AI Future",
      description: "Industry expert discusses the future of artificial intelligence.",
      location: "Lecture Hall B",
      clubId: "computer-science-club",
      submittedBy: "csc-president@aau.edu.et",
      startDaysAgo: 120,
      endDaysAgo: 119,
    },
    {
      title: "Charity Run",
      description: "5K charity run to support local communities. All proceeds go to education initiatives.",
      location: "Campus Track",
      clubId: "sports-club",
      submittedBy: "sports-president@aau.edu.et",
      startDaysAgo: 135,
      endDaysAgo: 134,
    },
    {
      title: "Movie Night",
      description: "Outdoor movie screening featuring Ethiopian films.",
      location: "Amphitheater",
      clubId: "music-club",
      submittedBy: "music-president@aau.edu.et",
      startDaysAgo: 150,
      endDaysAgo: 149,
    },
    {
      title: "Chess Championship",
      description: "Annual chess tournament open to all students. Test your strategy skills!",
      location: "Student Union Building",
      clubId: "debate-society",
      submittedBy: "debate-president@aau.edu.et",
      startDaysAgo: 165,
      endDaysAgo: 164,
    },
  ];

  // Create events
  for (const eventData of [...upcomingEvents, ...passedEvents]) {
    const { title, description, location, clubId, submittedBy, startDaysFromNow, endDaysFromNow, startDaysAgo, endDaysAgo } = eventData;

    const startTime = startDaysFromNow 
      ? new Date(now.getTime() + startDaysFromNow * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000);
    
    const endTime = endDaysFromNow 
      ? new Date(now.getTime() + endDaysFromNow * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000);

    // Create proposal with DIRECTOR_APPROVED status
    const proposal = await prisma.proposal.create({
      data: {
        clubId,
        submittedBy,
        status: "DIRECTOR_APPROVED",
        event: {
          create: {
            title,
            description,
            location,
            startTime,
            endTime,
          },
        },
      },
    });

    console.log(`Created event: ${title} (Status: ${proposal.status})`);
  }

  console.log("\n✅ Seed completed!");
  console.log(`- ${upcomingEvents.length} upcoming events created`);
  console.log(`- ${passedEvents.length} passed events created`);
}

try {
  await main();
} catch (error) {
  console.error("Error seeding events:", error);
} finally {
  await prisma.$disconnect();
}

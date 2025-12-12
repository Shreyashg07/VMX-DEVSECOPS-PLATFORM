import DashboardCard from "../components/DashboardCard";
import { Users } from "lucide-react";

// ✅ Import local images from /src/asset/
import ShreyashImg from "../asset/Shreyash.png";
import OmImg from "../asset/om.png";
import AmanImg from "../asset/aman.png";
import KishuImg from "../asset/kishu.png";

export default function AboutDevelopers() {
  const team = {
    leader: {
      name: "Shreyash Ghare",
      title: "Cybersecurity Aficionado • DevSecOps • Backend Developer",
      img: ShreyashImg,
    },
    members: [
      {
        name: "Omprasad Tilak",
        title: "Co-Lead • Frontend • AI-ML • Backend Developer",
        img: OmImg,
      },
      {
        name: "Aman Gupta",
        title: "Documentation • Frontend Developer",
        img: AmanImg,
      },
      {
        name: "Kishu Anand Raj",
        title: "Management • Prompting • Tester",
        img: KishuImg,
      },
    ],
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <h1 className="text-4xl font-bold text-white mb-6 flex items-center">
        <Users className="w-8 h-8 mr-3 text-[#64ffda]" />
        About Developers
      </h1>

      {/* Project Title */}
      <DashboardCard title="Innovative Project">
        <div className="text-[#ccd6f6] text-center">
          <h2 className="text-2xl font-semibold text-[#64ffda] mb-2">
            CI/CD Pipeline Integrity Monitoring & Code Injection Detection System
          </h2>
          <p className="text-[#8892b0] text-sm mb-8">
            A collaborative project focusing on automated code scanning, CI/CD integrity, and real-time security monitoring.
          </p>

          {/* Leader Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative">
              <img
                src={team.leader.img}
                alt={team.leader.name}
                className="w-32 h-32 rounded-full border-4 border-[#64ffda] shadow-lg object-cover"
              />
            </div>
            <h3 className="mt-4 text-xl font-bold text-[#ccd6f6]">{team.leader.name}</h3>
            <p className="text-[#8892b0] text-sm">{team.leader.title}</p>
            <p className="mt-2 text-[#64ffda] font-semibold text-sm">Team Leader</p>
          </div>

          {/* Members Section */}
          <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-8 justify-center">
            {team.members.map((m, i) => (
              <div
                key={i}
                className="flex flex-col items-center bg-[#0a192f] p-6 rounded-2xl border border-[#233554] hover:border-[#64ffda] transition-all"
              >
                <div className="relative">
                  <img
                    src={m.img}
                    alt={m.name}
                    className="w-24 h-24 rounded-full border-2 border-[#64ffda] object-cover"
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#ccd6f6]">{m.name}</h3>
                <p className="text-[#8892b0] text-sm text-center">{m.title}</p>
              </div>
            ))}
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

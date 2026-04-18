import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Target, Eye, Users, Lightbulb } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface AboutPageProps {
  onPageChange: (page: string) => void;
}

export function AboutPage({ onPageChange }: AboutPageProps) {
  const teamMembers = [
    {
      name: "Dr. Sarah Mitchell",
      role: "CEO & Co-Founder",
      bio: "Former education technology executive with 15+ years of experience in digital transformation.",
      avatar: "SM",
      expertise: ["EdTech", "Strategy", "Leadership"]
    },
    {
      name: "Alex Chen",
      role: "CTO & Co-Founder",
      bio: "Full-stack developer and blockchain expert, passionate about secure credential verification.",
      avatar: "AC",
      expertise: ["Blockchain", "Security", "APIs"]
    },
    {
      name: "Maria Rodriguez",
      role: "Head of Product",
      bio: "UX specialist focused on creating seamless experiences for students and recruiters.",
      avatar: "MR",
      expertise: ["UX Design", "Product Strategy", "Research"]
    },
    {
      name: "Dr. James Park",
      role: "Head of Verification",
      bio: "Former university registrar with expertise in academic credential verification systems.",
      avatar: "JP",
      expertise: ["Verification", "Academia", "Compliance"]
    }
  ];

  const milestones = [
    {
      year: "2023",
      title: "The Problem Identified",
      description: "Founded after witnessing countless talented students struggle to prove their achievements to employers."
    },
    {
      year: "2024",
      title: "MVP Launch",
      description: "Launched with 5 universities and 50+ companies, processing over 10,000 verifications."
    },
    {
      year: "2024",
      title: "Partnership Growth",
      description: "Expanded to 25+ institutions and 200+ corporate partners across North America."
    },
    {
      year: "2025",
      title: "Global Vision",
      description: "Aiming to become the global standard for educational credential verification."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <Badge className="bg-white/20 text-white border-white/30">
              🏢 About ProCred
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold">
              Building Trust in Education 🎓
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              We're revolutionizing how academic and professional achievements are verified, 
              creating a more transparent and efficient hiring ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Eye className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
                  </div>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    To create a world where every achievement is instantly verifiable, 
                    eliminating barriers between talented individuals and opportunities. 
                    We envision a future where credentials speak for themselves. ✨
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
                  </div>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    To empower students with a secure, comprehensive platform for showcasing 
                    their achievements while providing recruiters with reliable, verified 
                    information to make informed hiring decisions. 🎯
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1590650486895-79681b6f26a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRlYW0lMjBwcm9mZXNzaW9uYWwlMjBtZWV0aW5nfGVufDF8fHx8MTc1ODAxMjM5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Professional team meeting"
                className="w-full h-96 object-cover rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-200 rounded-full opacity-30 blur-2xl"></div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-green-200 rounded-full opacity-30 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why ProCred Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Why ProCred Exists 💡
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The story behind our mission to transform credential verification
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8 lg:p-12">
                <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full flex-shrink-0 mt-1">
                      <Lightbulb className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900">The Challenge We Saw 🔍</h3>
                      <p>
                        Sarah, a brilliant computer science student, had won multiple hackathons, 
                        completed advanced certifications, and led successful projects. Yet when 
                        applying for internships, recruiters couldn't easily verify her achievements.
                      </p>
                      <p>
                        Meanwhile, companies like TechCorp were struggling to identify genuine talent 
                        among thousands of applications, often missing qualified candidates due to 
                        lack of reliable verification systems.
                      </p>
                      <p>
                        This disconnect between talent and opportunity inspired us to create ProCred – 
                        a bridge that connects verified achievements with meaningful opportunities. 🌉
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Journey */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Our Journey 🚀
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From identifying the problem to building the solution
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold">
                    {milestone.year}
                  </div>
                </div>
                <Card className="flex-1 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                    <p className="text-gray-600">{milestone.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Meet Our Team 👥
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate professionals dedicated to transforming education verification
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow text-center">
                <CardContent className="p-6 space-y-4">
                  <Avatar className="h-20 w-20 mx-auto">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-lg">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                    <p className="text-blue-600 font-medium">{member.role}</p>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.expertise.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Our Values 💝
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8 space-y-4">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Trust & Transparency</h3>
                <p className="text-gray-600">Building systems that prioritize honesty and openness in all interactions.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8 space-y-4">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Innovation & Excellence</h3>
                <p className="text-gray-600">Continuously improving our technology to serve our users better.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-8 space-y-4">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Lightbulb className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Empowerment & Impact</h3>
                <p className="text-gray-600">Creating opportunities and removing barriers for student success.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Join Our Mission 🤝
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Be part of the transformation in education verification. Together, we can build a more transparent future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => onPageChange('login')} 
                className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 h-12"
              >
                Get Started Today 🚀
              </Button>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
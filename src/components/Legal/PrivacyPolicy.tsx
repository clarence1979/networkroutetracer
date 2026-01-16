import React from 'react';
import { Shield, School, Users, Database, Lock, Eye, FileText, AlertTriangle } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Shield className="h-6 w-6 text-blue-600 mr-2" />
        <h1 className="text-2xl font-semibold text-gray-900">Privacy Policy</h1>
      </div>

      <div className="prose max-w-none">
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <School className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-900 font-semibold mb-1">For Australian Schools</p>
              <p className="text-blue-800 text-sm">
                This privacy policy complies with the Privacy Act 1988 (Cth), Australian Privacy Principles (APPs), 
                and educational sector requirements for student data protection.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            1. Overview
          </h2>
          <p className="text-gray-700 mb-4">
            The Network Route Tracer is an educational tool designed for Year 9 Digital Technologies curriculum. 
            This privacy policy explains how we collect, use, store, and protect information when students and 
            educators use this application.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-AU')} <br />
              <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-AU')} <br />
              <strong>Review Period:</strong> Annually or as required by policy changes
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            2. Information We Collect
          </h2>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-3">2.1 Student Information</h3>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <p className="text-green-800 font-semibold mb-2">✓ No Personal Information Required</p>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• No student names, email addresses, or contact details collected</li>
              <li>• No student identification numbers or school records accessed</li>
              <li>• No authentication or login required for basic functionality</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">2.2 Technical Information</h3>
          <ul className="text-gray-700 space-y-2 mb-4">
            <li>• <strong>Network Trace Data:</strong> Domain names entered for educational traceroute demonstrations</li>
            <li>• <strong>Browser Information:</strong> Browser type and version for compatibility</li>
            <li>• <strong>Device Information:</strong> Screen resolution for responsive design</li>
            <li>• <strong>Usage Analytics:</strong> Which educational modules are accessed (anonymized)</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">2.3 Optional API Keys</h3>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>OpenAI API Keys:</strong> Stored locally in browser only. Never transmitted to our servers. 
              Used solely for AI-powered network analysis features. Schools can disable this feature entirely.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            3. How We Use Information
          </h2>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-3">3.1 Educational Purposes Only</h3>
          <ul className="text-gray-700 space-y-2 mb-4">
            <li>• Provide interactive network routing demonstrations</li>
            <li>• Generate educational content aligned with Australian Digital Technologies curriculum</li>
            <li>• Improve application performance and user experience</li>
            <li>• Provide technical support to schools and educators</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">3.2 Prohibited Uses</h3>
          <div className="bg-red-50 p-4 rounded-lg">
            <ul className="text-red-800 space-y-1 text-sm">
              <li>• No commercial use of student data</li>
              <li>• No marketing or advertising to students</li>
              <li>• No sharing with third parties for non-educational purposes</li>
              <li>• No creation of student profiles for non-educational purposes</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            4. Data Storage and Security
          </h2>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-3">4.1 Australian Data Sovereignty</h3>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• All data processed within Australian jurisdiction where possible</li>
              <li>• Compliance with Australian Government Information Security Manual (ISM)</li>
              <li>• Data hosting meets Australian Government security requirements</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">4.2 Security Measures</h3>
          <ul className="text-gray-700 space-y-2 mb-4">
            <li>• <strong>Encryption:</strong> All data transmitted using TLS 1.3 encryption</li>
            <li>• <strong>Access Controls:</strong> Role-based access for school administrators</li>
            <li>• <strong>Audit Logging:</strong> All system access logged and monitored</li>
            <li>• <strong>Regular Updates:</strong> Security patches applied within 48 hours</li>
            <li>• <strong>Incident Response:</strong> 24-hour notification to schools of any security incidents</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mb-3">4.3 Data Retention</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="text-gray-700 space-y-1 text-sm">
              <li>• <strong>Session Data:</strong> Cleared when browser is closed</li>
              <li>• <strong>Usage Analytics:</strong> Retained for 12 months maximum</li>
              <li>• <strong>Technical Logs:</strong> Retained for 90 days for troubleshooting</li>
              <li>• <strong>No Long-term Storage:</strong> No permanent student data retention</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            5. School Administrator Rights
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Access Rights</h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• View all usage within your school</li>
                <li>• Export usage reports for compliance</li>
                <li>• Configure feature availability</li>
                <li>• Disable external API integrations</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Control Options</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Block specific domains from traceroute</li>
                <li>• Disable AI-powered features</li>
                <li>• Set usage time restrictions</li>
                <li>• Configure content filtering</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            6. Third-Party Services
          </h2>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-3">6.1 Optional Integrations</h3>
          <div className="space-y-4">
            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">OpenAI API (Optional)</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• <strong>Purpose:</strong> AI-powered network analysis explanations</li>
                <li>• <strong>Data Sent:</strong> Domain names only (no personal information)</li>
                <li>• <strong>School Control:</strong> Can be completely disabled</li>
                <li>• <strong>Privacy Policy:</strong> <a href="https://openai.com/privacy" className="text-blue-600 underline">OpenAI Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg mt-4">
            <p className="text-yellow-800 text-sm">
              <strong>School IT Control:</strong> All third-party integrations can be disabled through 
              school network policies or application configuration. No third-party services are 
              required for core educational functionality.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Student Rights</h2>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Under Australian Privacy Law, students have the right to:</h4>
            <ul className="text-purple-800 text-sm space-y-1">
              <li>• Know what information is collected about them</li>
              <li>• Access any personal information held (none in this application)</li>
              <li>• Request correction of any inaccurate information</li>
              <li>• Complain about privacy breaches to the school or OAIC</li>
              <li>• Have their privacy respected in educational settings</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Compliance and Governance</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Australian Compliance</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Privacy Act 1988 (Cth)</li>
                <li>• Australian Privacy Principles</li>
                <li>• Education Services for Overseas Students Act</li>
                <li>• State education department policies</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Security Standards</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Australian Government ISM</li>
                <li>• ISO 27001 security practices</li>
                <li>• ACSC Essential Eight</li>
                <li>• Educational sector guidelines</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Privacy Officer</h4>
                <p className="text-gray-700 text-sm">
                  For privacy-related inquiries:<br />
                  Website: <a href="https://clarence.guru/#contact" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://clarence.guru/#contact</a><br />
                  Response time: 48 hours
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Technical Support</h4>
                <p className="text-gray-700 text-sm">
                  For technical issues:<br />
                  Website: <a href="https://clarence.guru/#contact" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://clarence.guru/#contact</a><br />
                  Response time: 48 hours
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-blue-900 mb-2">External Complaints</h4>
            <p className="text-blue-800 text-sm">
              If you are not satisfied with our response to your privacy concern, you may contact:<br />
              <strong>Office of the Australian Information Commissioner (OAIC)</strong><br />
              Website: <a href="https://www.oaic.gov.au" className="underline">www.oaic.gov.au</a><br />
              Phone: 1300 363 992
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Policy Updates</h2>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800 text-sm mb-2">
              <strong>Notification Process:</strong>
            </p>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Schools will be notified 30 days before any policy changes</li>
              <li>• Material changes require explicit school administrator approval</li>
              <li>• Policy version history maintained for audit purposes</li>
              <li>• Annual review conducted with school IT departments</li>
            </ul>
          </div>
        </section>

        <div className="border-t border-gray-200 pt-6 mt-8">
          <p className="text-sm text-gray-600 text-center">
            This privacy policy is specifically designed for Australian educational institutions and 
            complies with relevant privacy legislation and educational sector requirements.
          </p>
          <p className="text-xs text-gray-500 text-center mt-2">
            Document Version: 1.0 | Last Review: {new Date().toLocaleDateString('en-AU')} | 
            Next Review: {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU')}
          </p>
        </div>
      </div>
    </div>
  );
};
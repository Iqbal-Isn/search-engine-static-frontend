import React from "react";
import PropTypes from "prop-types";

// import shape10 from "../../assets/images/shape/shape-10.png";

import Button from "../../../components/button";
import IconBox from "../../../components/icon-box";
import SectionTitle from "../../../components/section-title";
import HomeData from "../../../data/home.json";

import '../../../assets/css/floatingAnimations.css'

const IconBoxContainer = ({ classOption }) => {
    return (
        <div className={`icon-area feature-section position-relative ${classOption}`}>
            <SectionTitle
                classOption="title-section mt-10 p-3 text-center"
                title="<span class='text-primary'>What Your Searches </br> <span class='text-dark' >Does</span> </span> "
                excerptClassOption="null"
                excerpt="Lets Have a Look"
            />
            <div className="container custom-container">
                <div className="row g-0 align-items-center">
                    {/* <div className="col-xl-6 col-lg-8 mx-auto mb-3 text-center">
                        <SectionTitle
                            classOption="title-section"
                            subTitle="FEATURES"
                            title="We are <span class='text-primary'>different</span> because..."
                            excerptClassOption="mb-10"
                            excerpt="Pleasure rationally encounter consequences that are extremely
                            painful. Nor again is there anyone who loves or pursues or
                            desires to obtain"
                        />
                        <Button
                            classOption="btn btn-lg btn-dark btn-hover-dark"
                            text="Get Started"
                            path="/about"
                        />
                    </div> */}

                    <div className="col-12 my-3">
                        <div id="grid" className="grid row mb-n7">
                            {HomeData[2].iconBox &&
                                HomeData[2].iconBox.map((single, key) => {
                                    return <IconBox key={key} data={single} />;
                                })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="moving-element-1">
                <img src="images/shape/shape-3.png" alt="" />
            </div>
            <div className="moving-element-2">
                <img src="images/shape/shape-4.png" alt="" />
            </div>
            <div className="moving-element-3">
                <img src="images/shape/shape-14.png" alt="" />
            </div>
            <div className="moving-element-4">
                <img src="images/shape/shape-6.png" alt="" />
            </div>
            <div className="moving-element-5">
                <img src="images/shape/shape-8.png" alt="" />
            </div>
        </div>
    );
};

IconBoxContainer.propTypes = {
    classOption: PropTypes.string,
};

IconBoxContainer.defaultProps = {
    classOption: "section-pb",
};

export default IconBoxContainer;
